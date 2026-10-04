import { promises as fs } from "fs";
import path from "path";
import type { FoodItem, FoodsDB } from "./types";

let cache: FoodsDB | null = null;

export async function loadFoods(): Promise<FoodsDB> {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), "data", "foods.json");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    cache = JSON.parse(raw) as FoodsDB;
    return cache;
  } catch {
    // 数据文件还没准备好时给一个空库（避免崩溃）
    cache = { version: "0.0", updated: "", items: [] };
    return cache;
  }
}

export async function searchFoods(query: string, limit = 12): Promise<FoodItem[]> {
  const db = await loadFoods();
  const q = query.trim().toLowerCase();
  if (!q) {
    return db.items.slice(0, limit);
  }
  // 拼音查询？纯字母+空格 → 走拼音匹配（也保留中文匹配）
  const isAlphaQuery = /^[a-z\s]+$/.test(q);

  const scored = db.items
    .map((item) => {
      const name = item.name.toLowerCase();
      const brand = (item.brand ?? "").toLowerCase();
      const tags = (item.tags ?? []).join(" ").toLowerCase();
      const pinyin = (item.pinyin ?? "").toLowerCase();
      const initials = (item.pinyin_initials ?? "").toLowerCase();
      let score = 0;

      // 中文 / tag 匹配
      if (name === q) score += 100;
      if (name.startsWith(q)) score += 50;
      if (name.includes(q)) score += 20;
      if (brand.includes(q)) score += 15;
      if (tags.includes(q)) score += 5;

      // 拼音匹配（纯字母查询时权重最高）
      if (isAlphaQuery) {
        const qNoSpace = q.replace(/\s+/g, "");
        if (initials === qNoSpace) score += 90;
        if (initials.startsWith(qNoSpace)) score += 50;
        if (pinyin.startsWith(qNoSpace)) score += 50;
        if (initials.includes(qNoSpace)) score += 25;
        if (pinyin.includes(qNoSpace)) score += 25;
      }

      // 多关键词
      const tokens = q.split(/\s+/);
      for (const t of tokens) {
        if (name.includes(t)) score += 3;
        if (brand.includes(t)) score += 2;
        if (isAlphaQuery && (pinyin.includes(t) || initials.includes(t))) score += 2;
      }
      return { item, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
  return scored;
}

export async function findFoodById(id: string): Promise<FoodItem | undefined> {
  const db = await loadFoods();
  return db.items.find((i) => i.id === id);
}
