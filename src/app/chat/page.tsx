import { prisma } from "@/lib/db";
import { getTodayStatus } from "@/lib/today-status";
import { requireProfile } from "@/lib/page-guard";
import { isAIConfigured } from "@/lib/ai";
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const { userId } = await requireProfile();

  const status = await getTodayStatus(userId);
  const messages = await prisma.chatMessage.findMany({
    where: { user_id: userId, role: { in: ["user", "assistant"] } },
    orderBy: { id: "asc" },
    take: 50,
  });

  return (
    <ChatClient
      initialStatus={status}
      initialMessages={messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "tool",
        content: m.content,
      }))}
      aiConfigured={isAIConfigured()}
    />
  );
}
