import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { categorizeMeal } from "@/lib/meal-category";
import { dayIdOf } from "@/lib/today";
import { getCurrentUserId } from "@/lib/auth";
import type { MealCategory, Confidence } from "@/lib/types";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const body = await req.json();
  const portion = Number(body.portion ?? 1);
  const now = new Date();
  let consumedAt = now;
  if (typeof body.consumed_time === "string" && /^\d{2}:\d{2}$/.test(body.consumed_time)) {
    const [h, m] = body.consumed_time.split(":").map(Number);
    consumedAt = new Date(now);
    consumedAt.setHours(h, m, 0, 0);
  }
  const meal: MealCategory = body.meal ?? categorizeMeal(consumedAt);
  const confidence: Confidence = body.confidence ?? "high";

  if (!body.name || body.kcal == null) {
    return NextResponse.json({ error: "missing name/kcal" }, { status: 400 });
  }

  const entry = await prisma.intakeEntry.create({
    data: {
      user_id: userId,
      food_id: body.food_id ?? null,
      name: body.name,
      brand: body.brand ?? null,
      meal,
      kcal: Math.round(Number(body.kcal) * portion),
      protein_g: (Number(body.protein_g) || 0) * portion,
      carb_g: (Number(body.carb_g) || 0) * portion,
      fat_g: (Number(body.fat_g) || 0) * portion,
      portion,
      consumed_at: consumedAt,
      day_id: dayIdOf(consumedAt),
      confidence,
      source: body.source ?? "用户输入",
      reasoning: body.reasoning ?? null,
    },
  });

  return NextResponse.json({ ok: true, id: entry.id });
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const entry = await prisma.intakeEntry.findUnique({ where: { id } });
  if (!entry || entry.user_id !== userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (entry.day_id !== dayIdOf()) {
    return NextResponse.json({ error: "已过当天，不可修改" }, { status: 403 });
  }
  await prisma.intakeEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const entry = await prisma.intakeEntry.findUnique({ where: { id } });
  if (!entry || entry.user_id !== userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (entry.day_id !== dayIdOf()) {
    return NextResponse.json({ error: "已过当天，不可修改" }, { status: 403 });
  }

  const newPortion = body.portion != null ? Number(body.portion) : entry.portion;
  const oldPortion = entry.portion || 1;
  const ratio = newPortion / oldPortion;
  const data: {
    portion?: number;
    kcal?: number;
    protein_g?: number;
    carb_g?: number;
    fat_g?: number;
    consumed_at?: Date;
    meal?: string;
  } = {};
  if (newPortion !== oldPortion) {
    data.portion = newPortion;
    data.kcal = Math.round(entry.kcal * ratio);
    data.protein_g = entry.protein_g * ratio;
    data.carb_g = entry.carb_g * ratio;
    data.fat_g = entry.fat_g * ratio;
  }
  if (body.consumed_time && /^\d{2}:\d{2}$/.test(body.consumed_time)) {
    const [h, m] = body.consumed_time.split(":").map(Number);
    const t = new Date(entry.consumed_at);
    t.setHours(h, m, 0, 0);
    data.consumed_at = t;
  }
  if (body.meal && ["breakfast", "lunch", "dinner", "snack"].includes(body.meal)) {
    data.meal = body.meal;
  }

  const updated = await prisma.intakeEntry.update({ where: { id }, data });
  return NextResponse.json({ ok: true, entry: { id: updated.id, kcal: updated.kcal, portion: updated.portion } });
}
