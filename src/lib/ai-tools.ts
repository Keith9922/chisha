import { prisma } from "./db";
import { searchFoods, findFoodById } from "./foods";
import { categorizeMeal } from "./meal-category";
import { caloriesBurned, EXERCISE_TYPES } from "./met";
import { dayIdOf } from "./today";
import { getTodayStatus } from "./today-status";
import { estimateFood } from "./estimate";
import type { Intensity, MealCategory } from "./types";

export interface ToolContext {
  userId: string;
}

// === Tool 定义（OpenAI Function Calling 格式）===
export const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "lookup_food",
      description:
        "在已收录的食物数据库中查询。包含 565 条连锁品牌（麦当劳/星巴克/瑞幸/便利店等）和标准食材。返回带 source 字段的精确数据。",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "食物名（可含品牌）" },
          limit: { type: "integer", description: "最多返回数量，默认 5", default: 5 },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "estimate_food",
      description:
        "用 AI 估算食物的热量和营养。当 lookup_food 没有匹配，或者用户描述的是家常菜/混合餐时调用。",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "完整描述用户吃了什么" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "log_intake",
      description: "把一项食物记录到今日摄入。**必须传 source**。",
      parameters: {
        type: "object",
        properties: {
          food_id: { type: "string" },
          name: { type: "string" },
          brand: { type: "string" },
          kcal: { type: "integer" },
          protein_g: { type: "number" },
          carb_g: { type: "number" },
          fat_g: { type: "number" },
          portion: { type: "number", default: 1.0 },
          meal: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
          source: { type: "string", description: "数据来源" },
          reasoning: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["name", "kcal", "source"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "log_exercise",
      description: "记录一次运动到今日消耗。",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: `可选 id：${EXERCISE_TYPES.map((e) => e.id).join(", ")}` },
          duration_min: { type: "integer" },
          intensity: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["type", "duration_min"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_today_status",
      description: "获取今日热量预算、已摄入、已消耗、剩余、宏量素分布、距睡眠时间。",
      parameters: { type: "object", properties: {} },
    },
  },
];

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  switch (name) {
    case "lookup_food": {
      const q = String(args.query ?? "");
      const limit = Number(args.limit ?? 5);
      const items = await searchFoods(q, limit);
      return {
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          brand: i.brand ?? "",
          kcal: i.kcal,
          portion: i.portion,
          protein_g: i.protein_g,
          carb_g: i.carb_g,
          fat_g: i.fat_g,
          confidence: i.confidence,
          source: i.source ?? "数据库",
        })),
        count: items.length,
        note: items.length === 0
          ? "未在数据库中找到。可以调用 estimate_food 让 AI 估算这一项。"
          : undefined,
      };
    }

    case "estimate_food": {
      const q = String(args.query ?? "");
      if (!q) return { ok: false, error: "missing query" };
      const est = await estimateFood(q);
      if (!est) return { ok: false, error: "估算失败" };
      return { ok: true, estimate: est };
    }

    case "log_intake": {
      const portion = Number(args.portion ?? 1.0);
      const now = new Date();
      const meal = (args.meal as MealCategory | undefined) ?? categorizeMeal(now);

      let name = args.name as string | undefined;
      let brand = args.brand as string | undefined;
      let kcal = args.kcal != null ? Number(args.kcal) : undefined;
      let protein = args.protein_g != null ? Number(args.protein_g) : undefined;
      let carb = args.carb_g != null ? Number(args.carb_g) : undefined;
      let fat = args.fat_g != null ? Number(args.fat_g) : undefined;
      let confidence: "high" | "medium" | "low" = (args.confidence as "high" | "medium" | "low") ?? "medium";
      let source = (args.source as string) ?? "AI 估算";
      const reasoning = (args.reasoning as string | undefined) ?? null;
      const food_id = args.food_id as string | undefined;

      if (food_id) {
        const f = await findFoodById(food_id);
        if (f) {
          name ??= f.name;
          brand ??= f.brand;
          kcal ??= f.kcal;
          protein ??= f.protein_g;
          carb ??= f.carb_g;
          fat ??= f.fat_g;
          confidence = f.confidence;
          source = f.source ?? source;
        }
      }

      if (!name || kcal == null) {
        return { ok: false, error: "缺少 name 或 kcal" };
      }

      const entry = await prisma.intakeEntry.create({
        data: {
          user_id: ctx.userId,
          food_id: food_id ?? null,
          name,
          brand: brand ?? null,
          meal,
          kcal: Math.round(kcal * portion),
          protein_g: (protein ?? 0) * portion,
          carb_g: (carb ?? 0) * portion,
          fat_g: (fat ?? 0) * portion,
          portion,
          consumed_at: now,
          day_id: dayIdOf(now),
          confidence,
          source,
          reasoning,
        },
      });
      const status = await getTodayStatus(ctx.userId, now);
      return {
        ok: true,
        entry_id: entry.id,
        recorded: { name, brand, meal, kcal: entry.kcal, portion, source },
        remaining_kcal: status.remaining_kcal,
        intake_kcal: status.intake_kcal,
      };
    }

    case "log_exercise": {
      const type = String(args.type ?? "other");
      const duration_min = Number(args.duration_min ?? 0);
      const intensity = (args.intensity as Intensity | undefined) ?? "medium";
      if (duration_min <= 0) return { ok: false, error: "duration_min 必须 > 0" };

      const profile = await prisma.profile.findUnique({ where: { user_id: ctx.userId } });
      const weight_kg = profile?.weight_kg ?? 70;
      const kcal = caloriesBurned({ type, duration_min, intensity, weight_kg });

      const now = new Date();
      const entry = await prisma.exerciseEntry.create({
        data: {
          user_id: ctx.userId,
          type: EXERCISE_TYPES.find((e) => e.id === type)?.name ?? type,
          duration_min,
          intensity,
          kcal_burned: kcal,
          performed_at: now,
          day_id: dayIdOf(now),
        },
      });
      const status = await getTodayStatus(ctx.userId, now);
      return {
        ok: true,
        entry_id: entry.id,
        recorded: { type: entry.type, duration_min, intensity, kcal_burned: kcal },
        remaining_kcal: status.remaining_kcal,
        exercise_kcal: status.exercise_kcal,
      };
    }

    case "get_today_status": {
      const s = await getTodayStatus(ctx.userId);
      return s;
    }

    default:
      return { ok: false, error: `未知工具: ${name}` };
  }
}
