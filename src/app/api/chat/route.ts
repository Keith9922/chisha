import { NextResponse, type NextRequest } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { AI_MODEL, SYSTEM_PROMPT, getAIClient, isAIConfigured } from "@/lib/ai";
import { TOOLS, executeTool } from "@/lib/ai-tools";
import { getTodayStatus } from "@/lib/today-status";
import { getCurrentUserId } from "@/lib/auth";

export const maxDuration = 60;

type ChatParam = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "missing message" }, { status: 400 });
  }

  if (!isAIConfigured()) {
    return NextResponse.json(
      {
        error: "AI 未配置",
        code: "MISSING_API_KEY",
        assistant_messages: [
          "AI 服务还没配好。本应用部署者需要在 Vercel / 本地 .env 里设置 `MINIMAX_API_KEY` 环境变量。\n你仍然可以正常用记录页加食物——所有数据库匹配的食物都不需要 AI。",
        ],
      },
      { status: 503 }
    );
  }

  await prisma.chatMessage.create({
    data: { user_id: userId, role: "user", content: message },
  });

  const history = await prisma.chatMessage.findMany({
    where: { user_id: userId },
    orderBy: { id: "asc" },
    take: 40,
  });

  const baseMessages: ChatParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => {
      if (m.role === "tool") {
        return {
          role: "tool" as const,
          content: m.content,
          tool_call_id: m.tool_call_id ?? "",
        };
      }
      if (m.role === "assistant") {
        const toolCalls = m.tool_calls ? JSON.parse(m.tool_calls) : undefined;
        return {
          role: "assistant" as const,
          content: m.content || null,
          ...(toolCalls && { tool_calls: toolCalls }),
        };
      }
      return { role: "user" as const, content: m.content };
    }),
  ];

  const client = getAIClient();
  const assistantMessages: string[] = [];

  let messages = [...baseMessages];
  let safety = 0;
  while (safety++ < 5) {
    let res;
    try {
      res = await client.chat.completions.create({
        model: AI_MODEL,
        messages,
        tools: TOOLS,
        temperature: 0.6,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("AI call failed:", msg);
      return NextResponse.json(
        {
          error: "AI 调用失败",
          detail: msg,
          assistant_messages: ["AI 暂时无法响应，可能是 API key 没配置或额度问题。"],
        },
        { status: 500 }
      );
    }

    const choice = res.choices[0];
    const msg = choice.message;
    const toolCalls = msg.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      await prisma.chatMessage.create({
        data: {
          user_id: userId,
          role: "assistant",
          content: msg.content ?? "",
          tool_calls: JSON.stringify(toolCalls),
        },
      });
      messages.push({
        role: "assistant",
        content: msg.content ?? null,
        tool_calls: toolCalls,
      });

      for (const tc of toolCalls) {
        if (tc.type !== "function") continue;
        const fn = tc.function;
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(fn.arguments || "{}"); } catch {}
        const result = await executeTool(fn.name, args, { userId });
        const resultStr = JSON.stringify(result);
        await prisma.chatMessage.create({
          data: { user_id: userId, role: "tool", content: resultStr, tool_call_id: tc.id },
        });
        messages.push({
          role: "tool",
          content: resultStr,
          tool_call_id: tc.id,
        });
      }
      continue;
    }

    const raw = msg.content ?? "";
    const text = stripThinking(raw);
    if (text) {
      assistantMessages.push(text);
      await prisma.chatMessage.create({
        data: { user_id: userId, role: "assistant", content: text },
      });
    }
    break;
  }

  const status = await getTodayStatus(userId);
  return NextResponse.json({ assistant_messages: assistantMessages, status });
}

export async function DELETE() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  await prisma.chatMessage.deleteMany({ where: { user_id: userId } });
  return NextResponse.json({ ok: true });
}

function stripThinking(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/g, "")
    .trim();
}
