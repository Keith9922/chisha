// 共用类型

export type Gender = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active";
export type Goal = "lose" | "maintain" | "gain";
export type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";
export type Intensity = "low" | "medium" | "high";
export type Confidence = "high" | "medium" | "low";

export const MEAL_LABELS: Record<MealCategory, { name: string; emoji: string }> = {
  breakfast: { name: "早餐", emoji: "🌅" },
  lunch: { name: "午餐", emoji: "🌞" },
  dinner: { name: "晚餐", emoji: "🌙" },
  snack: { name: "加餐", emoji: "✨" },
};

export const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary: "久坐（很少运动）",
  light: "轻度活动（每周 1-3 次）",
  moderate: "中度活动（每周 3-5 次）",
  active: "高强度活动（每周 6+ 次）",
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: "减脂",
  maintain: "维持",
  gain: "增肌",
};

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  kcal: number;
  portion: string;
  portion_grams?: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  tags?: string[];
  confidence: Confidence;
  source?: string; // 数据来源标签：'麦当劳官网' / '中国食物成分表' / '包装标注' / 'AI 估算' 等
  pinyin?: string;          // 全拼，如 'maidanglaobanshaojituibao'
  pinyin_initials?: string; // 首字母，如 'mdlbsjtb'
}

export interface FoodsDB {
  version: string;
  updated: string;
  items: FoodItem[];
}

// 来源类型 → 视觉颜色
export type SourceKind = "official" | "label" | "standard" | "ai" | "estimated" | "user";

// 把字符串来源映射成视觉类别
export function classifySource(source?: string): SourceKind {
  if (!source) return "estimated";
  if (source.includes("官网") || source.includes("官方")) return "official";
  if (source.includes("包装")) return "label";
  if (source.includes("食物成分表")) return "standard";
  if (source.includes("AI")) return "ai";
  if (source.includes("用户")) return "user";
  return "estimated";
}

export const SOURCE_STYLES: Record<SourceKind, { label: string; color: string; bg: string }> = {
  official:  { label: "官方",   color: "var(--color-success)",  bg: "var(--color-success-soft)"  },
  label:     { label: "包装",   color: "var(--color-success)",  bg: "var(--color-success-soft)"  },
  standard:  { label: "标准",   color: "#5C7AC4",                bg: "#E5EAF6"                    },
  ai:        { label: "AI",     color: "#8E5CC4",                bg: "#EFE5F6"                    },
  estimated: { label: "估算",   color: "var(--color-text-tertiary)", bg: "var(--color-border-soft)" },
  user:      { label: "自填",   color: "var(--color-text-secondary)", bg: "var(--color-border-soft)" },
};
