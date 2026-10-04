import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { dayIdOf } from "@/lib/today";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const meal = req.nextUrl.searchParams.get("meal");
  if (!meal) return NextResponse.json({ error: "missing meal" }, { status: 400 });

  const today = dayIdOf();
  const [y, m, d] = today.split("-").map(Number);
  const ydate = new Date(y, m - 1, d - 1);
  const yesterday = `${ydate.getFullYear()}-${String(ydate.getMonth() + 1).padStart(2, "0")}-${String(ydate.getDate()).padStart(2, "0")}`;

  const items = await prisma.intakeEntry.findMany({
    where: { user_id: userId, day_id: yesterday, meal },
    orderBy: { consumed_at: "asc" },
  });
  return NextResponse.json({
    yesterday,
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      brand: i.brand,
      kcal: i.kcal,
      portion: i.portion,
    })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const meal = req.nextUrl.searchParams.get("meal");
  if (!meal) return NextResponse.json({ error: "missing meal" }, { status: 400 });

  const today = dayIdOf();
  const [y, m, d] = today.split("-").map(Number);
  const ydate = new Date(y, m - 1, d - 1);
  const yesterday = `${ydate.getFullYear()}-${String(ydate.getMonth() + 1).padStart(2, "0")}-${String(ydate.getDate()).padStart(2, "0")}`;

  const items = await prisma.intakeEntry.findMany({
    where: { user_id: userId, day_id: yesterday, meal },
  });
  if (items.length === 0) {
    return NextResponse.json({ ok: true, copied: 0 });
  }

  const now = new Date();
  const created = await prisma.intakeEntry.createManyAndReturn({
    data: items.map((i) => {
      const t = new Date(i.consumed_at);
      const newAt = new Date(now);
      newAt.setHours(t.getHours(), t.getMinutes(), 0, 0);
      return {
        user_id: userId,
        food_id: i.food_id,
        name: i.name,
        brand: i.brand,
        meal: i.meal,
        kcal: i.kcal,
        protein_g: i.protein_g,
        carb_g: i.carb_g,
        fat_g: i.fat_g,
        portion: i.portion,
        consumed_at: newAt,
        day_id: today,
        confidence: i.confidence,
        source: i.source,
        reasoning: i.reasoning,
      };
    }),
  });
  return NextResponse.json({ ok: true, copied: created.length });
}
