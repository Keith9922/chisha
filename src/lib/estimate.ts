import { getAIClient, AI_MODEL } from "./ai";

export interface FoodEstimate {
  name: string;          // 规范化后的食物名
  kcal: number;          // 热量（kcal）
  protein_g: number;
  carb_g: number;
  fat_g: number;
  portion: string;       // "1 份" / "1 碗 (约 350g)" 等
  reasoning: string;     // 简要说明（怎么算的）
  confidence: "high" | "medium" | "low";
  source: string;        // "AI 估算"
}

const ESTIMATE_PROMPT = `你是营养师助手。用户描述了一份食物，请估算它的热量与营养成分。

要求：
1. 用 JSON 输出，不要任何 Markdown / 代码块包裹。
2. 字段：name (规范化的食物名), kcal (整数), protein_g, carb_g, fat_g (整数 g), portion (描述份量，如 "1 份 (约 350g)"), reasoning (1-2 句话，说明你怎么估算的，例如 "按麦当劳官方公布: 板烧鸡腿堡 391kcal" 或 "中等碗，米饭150g + 西红柿炒蛋 200g"), confidence ("high" 用了官方数据 / "medium" 标准菜品估算 / "low" 比较模糊).
3. 如果用户描述的是连锁品牌产品，使用品牌官方数据。
4. 如果是家常菜，按一份标准份量估算，并说明假设的份量。
5. 火锅 / 自助 / 烤肉这种"一顿"的，按一顿正常摄入量估算（通常 800-1500 kcal），并说明你的假设。
6. reasoning 要中文，简短直接，让用户能判断你估的合不合理。

只输出 JSON，没有其他文字。`;

export async function estimateFood(query: string): Promise<FoodEstimate | null> {
  const client = getAIClient();

  let res;
  try {
    res = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: ESTIMATE_PROMPT },
        { role: "user", content: query },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });
  } catch (e) {
    console.error("estimate failed:", e instanceof Error ? e.message : e);
    return null;
  }

  const raw = res.choices[0]?.message?.content ?? "";
  // 剥离推理模型的 think 块
  const cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/```(?:json)?\n?/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      name: String(parsed.name ?? query),
      kcal: Math.round(Number(parsed.kcal) || 0),
      protein_g: Math.round((Number(parsed.protein_g) || 0) * 10) / 10,
      carb_g: Math.round((Number(parsed.carb_g) || 0) * 10) / 10,
      fat_g: Math.round((Number(parsed.fat_g) || 0) * 10) / 10,
      portion: String(parsed.portion ?? "1 份"),
      reasoning: String(parsed.reasoning ?? ""),
      confidence: ["high", "medium", "low"].includes(parsed.confidence)
        ? parsed.confidence
        : "medium",
      source: "AI 估算",
    };
  } catch (e) {
    console.error("estimate parse failed:", e, "raw:", cleaned.slice(0, 500));
    return null;
  }
}
