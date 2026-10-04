import { NextResponse, type NextRequest } from "next/server";
import { getDayDetail } from "@/lib/today-status";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const day = req.nextUrl.searchParams.get("day");
  if (!day) return NextResponse.json({ error: "missing day" }, { status: 400 });
  const detail = await getDayDetail(userId, day);
  if (!detail) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(detail);
}
