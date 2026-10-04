import type { MealCategory } from "./types";

// 按时间自动归类餐次
// 早 5-10:59, 午 11-14:59, 晚 17-20:59, 加 其他
export function categorizeMeal(date: Date = new Date()): MealCategory {
  const h = date.getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 17 && h < 21) return "dinner";
  return "snack";
}
