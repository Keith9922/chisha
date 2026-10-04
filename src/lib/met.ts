import type { Intensity } from "./types";

// MET 值表（来源：Compendium of Physical Activities）
// 三档强度：低 / 中 / 高
export interface ExerciseType {
  id: string;
  name: string;
  emoji: string;
  met: Record<Intensity, number>;
  // 可选：默认强度
  defaultIntensity?: Intensity;
}

export const EXERCISE_TYPES: ExerciseType[] = [
  { id: "run", name: "跑步", emoji: "🏃", met: { low: 7.0, medium: 9.8, high: 11.8 } },
  { id: "walk", name: "步行", emoji: "🚶", met: { low: 2.8, medium: 3.5, high: 4.5 }, defaultIntensity: "medium" },
  { id: "bike", name: "骑自行车", emoji: "🚴", met: { low: 4.0, medium: 6.8, high: 10 } },
  { id: "swim", name: "游泳", emoji: "🏊", met: { low: 4.5, medium: 6.0, high: 8.3 } },
  { id: "strength", name: "力量训练", emoji: "🏋️", met: { low: 3.0, medium: 5.0, high: 6.0 } },
  { id: "hiit", name: "HIIT", emoji: "⚡", met: { low: 6.0, medium: 8.0, high: 10.0 }, defaultIntensity: "high" },
  { id: "yoga", name: "瑜伽", emoji: "🧘", met: { low: 2.0, medium: 2.5, high: 4.0 }, defaultIntensity: "low" },
  { id: "elliptical", name: "椭圆机", emoji: "🌀", met: { low: 4.0, medium: 5.0, high: 7.0 } },
  { id: "rowing", name: "划船机", emoji: "🚣", met: { low: 4.8, medium: 7.0, high: 8.5 } },
  { id: "stair", name: "爬坡 / 爬楼", emoji: "⛰️", met: { low: 4.0, medium: 6.0, high: 8.0 } },
  { id: "jump_rope", name: "跳绳", emoji: "⏭️", met: { low: 8.0, medium: 11.0, high: 12.3 }, defaultIntensity: "medium" },
  { id: "basketball", name: "篮球", emoji: "🏀", met: { low: 4.5, medium: 6.5, high: 8.0 } },
  { id: "badminton", name: "羽毛球", emoji: "🏸", met: { low: 4.5, medium: 5.5, high: 7.0 } },
  { id: "tennis", name: "网球", emoji: "🎾", met: { low: 5.0, medium: 7.3, high: 8.0 } },
  { id: "soccer", name: "足球", emoji: "⚽", met: { low: 6.0, medium: 7.0, high: 10.0 } },
  { id: "dance", name: "跳舞", emoji: "💃", met: { low: 3.5, medium: 5.0, high: 7.8 } },
  { id: "climbing", name: "攀岩", emoji: "🧗", met: { low: 5.5, medium: 7.5, high: 11.0 } },
  { id: "boxing", name: "拳击", emoji: "🥊", met: { low: 5.0, medium: 7.8, high: 12.8 } },
  { id: "other", name: "其他", emoji: "💪", met: { low: 3.0, medium: 5.0, high: 7.0 } },
];

// kcal = MET × weight(kg) × duration(h)
export function caloriesBurned(args: {
  type: string;
  duration_min: number;
  intensity: Intensity;
  weight_kg: number;
}): number {
  const ex = EXERCISE_TYPES.find((e) => e.id === args.type || e.name === args.type)
    ?? EXERCISE_TYPES.find((e) => e.id === "other")!;
  const met = ex.met[args.intensity];
  return Math.round((met * args.weight_kg * args.duration_min) / 60);
}

export function findExerciseType(idOrName: string): ExerciseType | undefined {
  return EXERCISE_TYPES.find((e) => e.id === idOrName || e.name === idOrName);
}
