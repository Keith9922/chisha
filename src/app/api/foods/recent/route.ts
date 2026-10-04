import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 8);

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const entries = await prisma.intakeEntry.findMany({
    where: { user_id: userId, created_at: { gte: since } },
    orderBy: { created_at: "desc" },
    take: 200,
  });

  const map = new Map<
    string,
    {
      key: string;
      food_id: string | null;
      name: string;
      brand: string | null;
      kcal: number;
      protein_g: number;
      carb_g: number;
      fat_g: number;
      source: string;
      confidence: string;
      count: number;
      lastTime: Date;
    }
  >();

  for (const e of entries) {
    const key = e.food_id ?? `${e.brand ?? ""}|${e.name}`;
    const cur = map.get(key);
    if (cur) {
      cur.count++;
      if (e.created_at > cur.lastTime) cur.lastTime = e.created_at;
    } else {
      const stdKcal = e.portion > 0 ? Math.round(e.kcal / e.portion) : e.kcal;
      const stdProtein = e.portion > 0 ? e.protein_g / e.portion : e.protein_g;
      const stdCarb = e.portion > 0 ? e.carb_g / e.portion : e.carb_g;
      const stdFat = e.portion > 0 ? e.fat_g / e.portion : e.fat_g;
      map.set(key, {
        key,
        food_id: e.food_id,
        name: e.name,
        brand: e.brand,
        kcal: stdKcal,
        protein_g: stdProtein,
        carb_g: stdCarb,
        fat_g: stdFat,
        source: e.source,
        confidence: e.confidence,
        count: 1,
        lastTime: e.created_at,
      });
    }
  }

  const items = [...map.values()]
    .sort((a, b) => b.count - a.count || b.lastTime.getTime() - a.lastTime.getTime())
    .slice(0, limit)
    .map((i) => ({
      key: i.key,
      food_id: i.food_id,
      name: i.name,
      brand: i.brand,
      kcal: i.kcal,
      protein_g: i.protein_g,
      carb_g: i.carb_g,
      fat_g: i.fat_g,
      source: i.source,
      confidence: i.confidence,
      count: i.count,
    }));

  return NextResponse.json({ items });
}
