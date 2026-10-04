import type { Activity, Gender, Goal } from "./types";

// Mifflin-St Jeor BMR
export function bmr(args: {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: Gender;
}): number {
  const base = 10 * args.weight_kg + 6.25 * args.height_cm - 5 * args.age;
  return Math.round(base + (args.gender === "male" ? 5 : -161));
}

const ACTIVITY_MULTIPLIER: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export function tdee(args: {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: Gender;
  activity: Activity;
}): number {
  return Math.round(bmr(args) * ACTIVITY_MULTIPLIER[args.activity]);
}

// 推荐每日预算 = TDEE - 缺口/盈余
export function dailyBudget(args: {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: Gender;
  activity: Activity;
  goal: Goal;
}): number {
  const t = tdee(args);
  if (args.goal === "lose") return t - 500; // 0.5kg/周
  if (args.goal === "gain") return t + 300;
  return t;
}

// 蛋白目标（按减脂上限 2.0g/kg）
export function proteinTarget(weight_kg: number, goal: Goal): number {
  const factor = goal === "lose" ? 2.0 : goal === "gain" ? 1.8 : 1.4;
  return Math.round(weight_kg * factor);
}
