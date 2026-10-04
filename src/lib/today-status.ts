import { prisma } from "./db";
import { dayIdOf, timeUntilBedtime } from "./today";

export interface TodayStatus {
  day_id: string;
  budget_kcal: number;
  protein_target_g: number;
  intake_kcal: number;
  intake_protein_g: number;
  intake_carb_g: number;
  intake_fat_g: number;
  exercise_kcal: number;
  remaining_kcal: number;
  pct_consumed: number;
  bedtime: string;
  time_until_bedtime: string;
  has_profile: boolean;
}

export async function getTodayStatus(userId: string, now: Date = new Date()): Promise<TodayStatus> {
  const profile = await prisma.profile.findUnique({ where: { user_id: userId } });
  const dayId = dayIdOf(now);

  const [intakes, exercises] = await Promise.all([
    prisma.intakeEntry.findMany({ where: { user_id: userId, day_id: dayId } }),
    prisma.exerciseEntry.findMany({ where: { user_id: userId, day_id: dayId } }),
  ]);

  const intake_kcal = intakes.reduce((s, i) => s + i.kcal, 0);
  const intake_protein_g = intakes.reduce((s, i) => s + i.protein_g, 0);
  const intake_carb_g = intakes.reduce((s, i) => s + i.carb_g, 0);
  const intake_fat_g = intakes.reduce((s, i) => s + i.fat_g, 0);
  const exercise_kcal = exercises.reduce((s, e) => s + e.kcal_burned, 0);

  const budget = profile?.budget_kcal ?? 1850;
  const protein_target = profile?.protein_target ?? 120;
  const bedtime = profile?.bedtime ?? "23:00";

  const effective_budget = budget + exercise_kcal;
  const remaining = effective_budget - intake_kcal;
  const pct = Math.max(0, Math.min(100, Math.round((intake_kcal / effective_budget) * 100)));

  return {
    day_id: dayId,
    budget_kcal: budget,
    protein_target_g: protein_target,
    intake_kcal,
    intake_protein_g: Math.round(intake_protein_g),
    intake_carb_g: Math.round(intake_carb_g),
    intake_fat_g: Math.round(intake_fat_g),
    exercise_kcal,
    remaining_kcal: remaining,
    pct_consumed: pct,
    bedtime,
    time_until_bedtime: timeUntilBedtime(bedtime, now),
    has_profile: !!profile,
  };
}

export interface DayHistory {
  day_id: string;
  intake_kcal: number;
  exercise_kcal: number;
  budget_kcal: number;
  remaining_kcal: number;
  met_goal: boolean;
}

export interface DayDetail {
  day_id: string;
  intake_kcal: number;
  intake_protein_g: number;
  intake_carb_g: number;
  intake_fat_g: number;
  exercise_kcal: number;
  budget_kcal: number;
  remaining_kcal: number;
  met_goal: boolean;
  meals: {
    meal: string;
    items: {
      id: number;
      name: string;
      brand: string | null;
      kcal: number;
      portion: number;
      source: string;
      reasoning: string | null;
      consumed_at: string;
    }[];
    total: number;
  }[];
  exercises: {
    id: number;
    type: string;
    duration_min: number;
    intensity: string;
    kcal_burned: number;
    performed_at: string;
  }[];
}

export async function getRecentDays(userId: string, days = 30): Promise<DayHistory[]> {
  const profile = await prisma.profile.findUnique({ where: { user_id: userId } });
  const budget = profile?.budget_kcal ?? 1850;

  const intakes = await prisma.intakeEntry.findMany({
    where: { user_id: userId },
    select: { day_id: true, kcal: true },
  });
  const exercises = await prisma.exerciseEntry.findMany({
    where: { user_id: userId },
    select: { day_id: true, kcal_burned: true },
  });

  const map = new Map<string, { intake: number; exercise: number }>();
  for (const i of intakes) {
    const cur = map.get(i.day_id) ?? { intake: 0, exercise: 0 };
    cur.intake += i.kcal;
    map.set(i.day_id, cur);
  }
  for (const e of exercises) {
    const cur = map.get(e.day_id) ?? { intake: 0, exercise: 0 };
    cur.exercise += e.kcal_burned;
    map.set(e.day_id, cur);
  }

  const arr: DayHistory[] = Array.from(map.entries()).map(([day_id, v]) => {
    const remaining = budget + v.exercise - v.intake;
    return {
      day_id,
      intake_kcal: v.intake,
      exercise_kcal: v.exercise,
      budget_kcal: budget,
      remaining_kcal: remaining,
      met_goal: remaining >= 0,
    };
  });
  arr.sort((a, b) => (a.day_id < b.day_id ? 1 : -1));
  return arr.slice(0, days);
}

// 当前连续达标天数（不算今天，从昨天往前数）
export function calcCurrentStreak(days: DayHistory[], todayId: string): number {
  const past = days.filter((d) => d.day_id !== todayId);
  if (past.length === 0) return 0;
  const dayIds = new Set(past.filter((d) => d.met_goal).map((d) => d.day_id));
  let streak = 0;
  const cursor = new Date(todayId + "T12:00:00");
  cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const id = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (dayIds.has(id)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function getDayDetail(userId: string, dayId: string): Promise<DayDetail | null> {
  const profile = await prisma.profile.findUnique({ where: { user_id: userId } });
  const budget = profile?.budget_kcal ?? 1850;

  const [intakes, exercises] = await Promise.all([
    prisma.intakeEntry.findMany({
      where: { user_id: userId, day_id: dayId },
      orderBy: { consumed_at: "asc" },
    }),
    prisma.exerciseEntry.findMany({
      where: { user_id: userId, day_id: dayId },
      orderBy: { performed_at: "asc" },
    }),
  ]);

  const intake_kcal = intakes.reduce((s, i) => s + i.kcal, 0);
  const exercise_kcal = exercises.reduce((s, e) => s + e.kcal_burned, 0);
  const remaining = budget + exercise_kcal - intake_kcal;

  const ORDER = ["breakfast", "lunch", "dinner", "snack"];
  const meals = ORDER.map((m) => {
    const items = intakes.filter((i) => i.meal === m);
    return {
      meal: m,
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        brand: i.brand,
        kcal: i.kcal,
        portion: i.portion,
        source: i.source,
        reasoning: i.reasoning,
        consumed_at: i.consumed_at.toISOString(),
      })),
      total: items.reduce((s, i) => s + i.kcal, 0),
    };
  }).filter((m) => m.items.length > 0);

  return {
    day_id: dayId,
    intake_kcal,
    intake_protein_g: Math.round(intakes.reduce((s, i) => s + i.protein_g, 0)),
    intake_carb_g: Math.round(intakes.reduce((s, i) => s + i.carb_g, 0)),
    intake_fat_g: Math.round(intakes.reduce((s, i) => s + i.fat_g, 0)),
    exercise_kcal,
    budget_kcal: budget,
    remaining_kcal: remaining,
    met_goal: remaining >= 0,
    meals,
    exercises: exercises.map((e) => ({
      id: e.id,
      type: e.type,
      duration_min: e.duration_min,
      intensity: e.intensity,
      kcal_burned: e.kcal_burned,
      performed_at: e.performed_at.toISOString(),
    })),
  };
}
