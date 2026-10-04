import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { dayIdOf } from "@/lib/today";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const body = await req.json();
  const weight = Number(body.weight_kg);
  if (!weight || weight < 20 || weight > 300) {
    return NextResponse.json({ error: "体重值不合理 (20-300kg)" }, { status: 400 });
  }
  const dayId: string = body.day_id || dayIdOf();
  const note = body.note ? String(body.note).slice(0, 200) : null;

  const entry = await prisma.weightEntry.upsert({
    where: { user_id_day_id: { user_id: userId, day_id: dayId } },
    create: { user_id: userId, day_id: dayId, weight_kg: weight, note },
    update: { weight_kg: weight, note, recorded_at: new Date() },
  });

  // 同步更新 profile.weight_kg
  await prisma.profile
    .update({ where: { user_id: userId }, data: { weight_kg: weight } })
    .catch(() => {});

  return NextResponse.json({ ok: true, id: entry.id });
}

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 90);
  const entries = await prisma.weightEntry.findMany({
    where: { user_id: userId },
    orderBy: { day_id: "desc" },
    take: limit,
  });
  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      day_id: e.day_id,
      weight_kg: e.weight_kg,
      note: e.note,
      recorded_at: e.recorded_at.toISOString(),
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const entry = await prisma.weightEntry.findUnique({ where: { id } });
  if (!entry || entry.user_id !== userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await prisma.weightEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
