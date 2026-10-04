import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { caloriesBurned, EXERCISE_TYPES } from "@/lib/met";
import { dayIdOf } from "@/lib/today";
import { getCurrentUserId } from "@/lib/auth";
import type { Intensity } from "@/lib/types";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const body = await req.json();
  const type = String(body.type ?? "other");
  const duration_min = Number(body.duration_min ?? 0);
  const intensity: Intensity = body.intensity ?? "medium";
  if (duration_min <= 0) {
    return NextResponse.json({ error: "duration_min 必须 > 0" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({ where: { user_id: userId } });
  const weight_kg = profile?.weight_kg ?? 70;
  const kcal = caloriesBurned({ type, duration_min, intensity, weight_kg });

  const now = new Date();
  let performedAt = now;
  if (typeof body.performed_time === "string" && /^\d{2}:\d{2}$/.test(body.performed_time)) {
    const [h, m] = body.performed_time.split(":").map(Number);
    performedAt = new Date(now);
    performedAt.setHours(h, m, 0, 0);
  }

  const entry = await prisma.exerciseEntry.create({
    data: {
      user_id: userId,
      type: EXERCISE_TYPES.find((e) => e.id === type)?.name ?? type,
      duration_min,
      intensity,
      kcal_burned: kcal,
      performed_at: performedAt,
      day_id: dayIdOf(performedAt),
    },
  });

  return NextResponse.json({ ok: true, id: entry.id, kcal });
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const entry = await prisma.exerciseEntry.findUnique({ where: { id } });
  if (!entry || entry.user_id !== userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (entry.day_id !== dayIdOf()) {
    return NextResponse.json({ error: "已过当天，不可修改" }, { status: 403 });
  }
  await prisma.exerciseEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
