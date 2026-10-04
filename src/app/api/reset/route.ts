import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { dayIdOf } from "@/lib/today";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const scope = req.nextUrl.searchParams.get("scope") ?? "today";

  if (scope === "today") {
    const today = dayIdOf();
    await Promise.all([
      prisma.intakeEntry.deleteMany({ where: { user_id: userId, day_id: today } }),
      prisma.exerciseEntry.deleteMany({ where: { user_id: userId, day_id: today } }),
    ]);
    return NextResponse.json({ ok: true, scope: "today" });
  }

  if (scope === "all") {
    await Promise.all([
      prisma.intakeEntry.deleteMany({ where: { user_id: userId } }),
      prisma.exerciseEntry.deleteMany({ where: { user_id: userId } }),
      prisma.chatMessage.deleteMany({ where: { user_id: userId } }),
      prisma.weightEntry.deleteMany({ where: { user_id: userId } }),
    ]);
    return NextResponse.json({ ok: true, scope: "all" });
  }

  return NextResponse.json({ error: "invalid scope" }, { status: 400 });
}
