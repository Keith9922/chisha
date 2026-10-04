import { NextResponse } from "next/server";
import { getTodayStatus } from "@/lib/today-status";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const status = await getTodayStatus(userId);
  return NextResponse.json(status);
}
