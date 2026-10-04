"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MEAL_LABELS, type MealCategory, type FoodItem } from "@/lib/types";
import SourceBadge from "./SourceBadge";
import { useToast } from "./Toast";

interface PickedFood {
  source_kind: "db" | "ai" | "recent";
  id?: string;
  name: string;
  brand?: string;
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  portion: string;
  source: string;
  confidence: string;
  reasoning?: string;
}

interface RecentFood {
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
}

// 兜底建议（用户从没记过任何东西时显示）
const FIRST_TIME_SUGGESTIONS = [
  "麦当劳板烧鸡腿堡", "瑞幸生椰拿铁", "全家三明治",
  "西红柿炒鸡蛋盖饭", "一份小火锅", "一根香蕉",
];

export default function AddFoodSheet({
  meal,
  onClose,
}: {
  meal: MealCategory;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [picked, setPicked] = useState<PickedFood | null>(null);
  const [portion, setPortion] = useState(1);
  const [searching, setSearching] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiBlocked, setAiBlocked] = useState<string | null>(null);
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [yesterday, setYesterday] = useState<{ items: { name: string; kcal: number }[] } | null>(null);
  const [copyingYesterday, setCopyingYesterday] = useState(false);
  const [consumedTime, setConsumedTime] = useState<string>(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  });

  useEffect(() => {
    inputRef.current?.focus();
    // 拉真实最近常吃
    fetch("/api/foods/recent?limit=8")
      .then((r) => r.json())
      .then((j) => setRecentFoods(j.items ?? []))
      .catch(() => {});
    fetch(`/api/meal-yesterday?meal=${meal}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.items && j.items.length > 0) setYesterday(j);
      })
      .catch(() => {});
  }, [meal]);

  async function copyYesterday() {
    setCopyingYesterday(true);
    const r = await fetch(`/api/meal-yesterday?meal=${meal}`, { method: "POST" });
    setCopyingYesterday(false);
    if (r.ok) {
      const j = await r.json();
      router.refresh();
      onClose();
      toast.show(`已复制昨天的 ${j.copied} 项`, "success");
    } else {
      toast.show("复制失败", "error");
    }
  }

  // 搜库 (debounced)
  useEffect(() => {
    let cancel = false;
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const r = await fetch(`/api/foods/search?q=${encodeURIComponent(query)}`);
      const j = await r.json();
      if (!cancel) {
        setResults(j.items ?? []);
        setSearching(false);
      }
    }, 150);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [query]);

  // 选定 DB 中食物
  function pickFromDB(item: FoodItem) {
    setPicked({
      source_kind: "db",
      id: item.id,
      name: item.name,
      brand: item.brand,
      kcal: item.kcal,
      protein_g: item.protein_g,
      carb_g: item.carb_g,
      fat_g: item.fat_g,
      portion: item.portion,
      source: item.source ?? "数据库",
      confidence: item.confidence,
    });
    setPortion(1);
  }

  function pickFromRecent(item: RecentFood) {
    setPicked({
      source_kind: "recent",
      id: item.food_id ?? undefined,
      name: item.name,
      brand: item.brand ?? undefined,
      kcal: item.kcal,
      protein_g: item.protein_g,
      carb_g: item.carb_g,
      fat_g: item.fat_g,
      portion: "标准份量",
      source: item.source,
      confidence: item.confidence,
    });
    setPortion(1);
  }

  // 让 AI 估算
  async function askAIEstimate(text?: string) {
    const q = (text ?? query).trim();
    if (!q) return;
    setAiBlocked(null);
    setEstimating(true);
    try {
      const r = await fetch("/api/foods/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const j = await r.json();
      if (!r.ok || !j.estimate) {
        setAiBlocked(j.error ?? "估算失败");
        return;
      }
      const e = j.estimate;
      setPicked({
        source_kind: "ai",
        name: e.name,
        kcal: e.kcal,
        protein_g: e.protein_g,
        carb_g: e.carb_g,
        fat_g: e.fat_g,
        portion: e.portion,
        source: e.source,
        confidence: e.confidence,
        reasoning: e.reasoning,
      });
      setPortion(1);
    } finally {
      setEstimating(false);
    }
  }

  async function submit() {
    if (!picked) return;
    setSubmitting(true);
    const r = await fetch("/api/log-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        food_id: picked.id ?? null,
        name: picked.name,
        brand: picked.brand,
        kcal: picked.kcal,
        protein_g: picked.protein_g,
        carb_g: picked.carb_g,
        fat_g: picked.fat_g,
        portion,
        meal,
        confidence: picked.confidence,
        source: picked.source,
        reasoning: picked.reasoning ?? null,
        consumed_time: consumedTime,
      }),
    });
    if (r.ok) {
      router.refresh();
      onClose();
      toast.show(`已记 ${picked.name} ${totalKcal} kcal`, "success");
    } else {
      setSubmitting(false);
      toast.show("记录失败，请重试", "error");
    }
  }

  const totalKcal = picked ? Math.round(picked.kcal * portion) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="absolute inset-0"
        style={{ background: "rgba(20, 15, 10, 0.32)", backdropFilter: "blur(2px)" }}
      />
      <div
        className="relative w-full max-w-[480px] rounded-t-3xl pb-6 px-5 pt-3 max-h-[88vh] flex flex-col"
        style={{ background: "var(--color-bg-app)", boxShadow: "0 -10px 40px rgba(40, 30, 20, 0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-4 shrink-0" style={{ background: "#D5CFC4" }} />
        <div className="text-base font-medium mb-3 px-1 shrink-0">
          加到{" "}
          <span style={{ color: "var(--color-accent)" }}>
            {MEAL_LABELS[meal].emoji} {MEAL_LABELS[meal].name}
          </span>
        </div>

        {/* 搜索框 */}
        <div
          className="card border flex items-center gap-2.5 px-3.5 py-3 mb-3 shrink-0"
          style={{ borderColor: "var(--color-border)" }}
        >
          <span style={{ color: "var(--color-text-tertiary)" }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPicked(null);
              setAiBlocked(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim() && !picked && results.length === 0) {
                e.preventDefault();
                askAIEstimate();
              }
            }}
            placeholder="搜或描述吃了什么 — 如 '一份西红柿炒蛋盖饭'"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setPicked(null);
                setAiBlocked(null);
              }}
              className="text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 选中食物的详情 */}
        {picked && (
          <div className="card p-4 mb-3 shrink-0">
            <div className="flex justify-between items-start mb-1">
              <div className="min-w-0 pr-2">
                <div className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
                  <span>{picked.name}</span>
                  <SourceBadge source={picked.source} />
                </div>
                <div className="text-[11px] mt-1" style={{ color: "var(--color-text-tertiary)" }}>
                  {picked.brand ? `${picked.brand} · ` : ""}
                  {picked.portion}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="num text-2xl" style={{ color: "var(--color-accent)" }}>
                  {totalKcal}
                </span>
                <span className="text-[10px] ml-1" style={{ color: "var(--color-text-secondary)" }}>kcal</span>
              </div>
            </div>

            {/* AI 估算的 reasoning */}
            {picked.reasoning && (
              <div
                className="text-[11px] mt-2 mb-1 px-2.5 py-2 rounded-lg leading-relaxed"
                style={{ background: "#EFE5F6", color: "#6B4F8F" }}
              >
                💡 {picked.reasoning}
              </div>
            )}

            <div
              className="flex justify-between items-center mt-3 pt-3 border-t"
              style={{ borderColor: "var(--color-border-soft)" }}
            >
              <span className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>份量</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPortion((p) => Math.max(0.25, +(p - 0.25).toFixed(2)))}
                  className="w-7 h-7 rounded-full border flex items-center justify-center text-sm"
                  style={{ background: "var(--color-bg-app)", borderColor: "var(--color-border)" }}
                >−</button>
                <span className="num text-base min-w-6 text-center">{portion}</span>
                <button
                  onClick={() => setPortion((p) => +(p + 0.25).toFixed(2))}
                  className="w-7 h-7 rounded-full border flex items-center justify-center text-sm"
                  style={{ background: "var(--color-bg-app)", borderColor: "var(--color-border)" }}
                >+</button>
              </div>
            </div>

            <div
              className="flex justify-between items-center pt-3 mt-1 border-t"
              style={{ borderColor: "var(--color-border-soft)" }}
            >
              <span className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>时间</span>
              <input
                type="time"
                value={consumedTime}
                onChange={(e) => setConsumedTime(e.target.value)}
                className="num text-sm bg-transparent outline-none text-right"
                style={{ color: "var(--color-text-primary)" }}
              />
            </div>

            <div
              className="flex gap-4 pt-3 mt-2 text-[11px] border-t"
              style={{ borderColor: "var(--color-border-soft)", color: "var(--color-text-secondary)" }}
            >
              <span>
                <span className="num" style={{ color: "var(--color-text-primary)" }}>
                  {Math.round(picked.protein_g * portion)}g
                </span>{" "}蛋白
              </span>
              <span>
                <span className="num" style={{ color: "var(--color-text-primary)" }}>
                  {Math.round(picked.carb_g * portion)}g
                </span>{" "}碳水
              </span>
              <span>
                <span className="num" style={{ color: "var(--color-text-primary)" }}>
                  {Math.round(picked.fat_g * portion)}g
                </span>{" "}脂肪
              </span>
            </div>
          </div>
        )}

        {/* 列表 / 估算引导 */}
        {!picked && (
          <div className="flex-1 overflow-y-auto no-scrollbar -mx-1 px-1">
            {/* 昨天同一餐 — 显眼放最上 */}
            {!query && yesterday && yesterday.items.length > 0 && (
              <button
                onClick={copyYesterday}
                disabled={copyingYesterday}
                className="card w-full px-3.5 py-3 flex items-center justify-between text-left mb-3"
                style={{
                  background: "var(--color-accent-soft)",
                  border: "1px solid var(--color-accent)",
                }}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>
                    {copyingYesterday ? "复制中..." : `🔁 复制昨天的 ${MEAL_LABELS[meal].name}`}
                  </div>
                  <div className="text-[11px] mt-0.5 truncate" style={{ color: "var(--color-text-secondary)" }}>
                    {yesterday.items.map((i) => i.name).join(" · ")}
                  </div>
                </div>
                <span className="num text-base" style={{ color: "var(--color-accent)" }}>
                  {yesterday.items.reduce((s, i) => s + i.kcal, 0)}
                </span>
              </button>
            )}

            {/* 空查询时给推荐：优先真实"最近常吃"，否则首次建议 */}
            {!query && recentFoods.length > 0 && (
              <>
                <div className="section-title flex justify-between items-center">
                  <span>最近常吃</span>
                  <span className="normal-case tracking-normal" style={{ color: "var(--color-text-tertiary)" }}>
                    一键再加
                  </span>
                </div>
                <div className="space-y-1.5 mb-4">
                  {recentFoods.map((it) => (
                    <button
                      key={it.key}
                      onClick={() => pickFromRecent(it)}
                      className="card w-full px-3.5 py-2.5 flex items-center justify-between text-left"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-sm font-medium truncate flex items-center gap-1.5">
                          <span>{it.name}</span>
                          {it.count > 1 && (
                            <span
                              className="text-[10px] px-1 rounded"
                              style={{
                                background: "var(--color-accent-soft)",
                                color: "var(--color-accent)",
                              }}
                            >
                              ×{it.count}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] mt-0.5 truncate flex items-center gap-1.5" style={{ color: "var(--color-text-tertiary)" }}>
                          {it.brand && <span>{it.brand}</span>}
                          <SourceBadge source={it.source} />
                        </div>
                      </div>
                      <div className="num text-base shrink-0" style={{ color: "var(--color-accent)" }}>
                        {it.kcal}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* 没历史 → 首次启动建议（chip 形式，让用户快速试） */}
            {!query && recentFoods.length === 0 && (
              <>
                <div className="section-title">不知道吃啥？试这些</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {FIRST_TIME_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="text-xs px-3 py-1.5 rounded-full"
                      style={{
                        background: "var(--color-bg-card)",
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border-soft)",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* 数据库结果 */}
            {results.length > 0 && (
              <>
                <div className="section-title flex justify-between items-center">
                  <span>数据库匹配</span>
                  <span style={{ color: "var(--color-text-tertiary)" }}>{results.length} 项</span>
                </div>
                <div className="space-y-1.5 mb-4">
                  {results.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => pickFromDB(it)}
                      className="card w-full px-3.5 py-3 flex items-center justify-between text-left"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-sm font-medium truncate flex items-center gap-1.5">
                          <span>{it.name}</span>
                          <SourceBadge source={it.source} />
                        </div>
                        <div className="text-[11px] mt-0.5 truncate" style={{ color: "var(--color-text-tertiary)" }}>
                          {it.brand ? `${it.brand} · ` : ""}
                          {it.portion}
                        </div>
                      </div>
                      <div className="num text-base shrink-0" style={{ color: "var(--color-accent)" }}>
                        {it.kcal}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* 没结果 → 引导 AI 估算 */}
            {query && !searching && results.length === 0 && !estimating && (
              <div className="card-empty p-5 text-center">
                <div className="text-2xl mb-2">🤔</div>
                <div className="text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  数据库里没有 "{query}"
                </div>
                <div className="text-[11px] mb-3" style={{ color: "var(--color-text-tertiary)" }}>
                  让 AI 根据你的描述估算
                </div>
                <button
                  onClick={() => askAIEstimate()}
                  className="text-sm px-4 py-2 rounded-xl font-medium"
                  style={{ background: "#EFE5F6", color: "#6B4F8F" }}
                >
                  ✨ AI 估算这一项
                </button>
              </div>
            )}

            {/* 即使有结果，也提供"让 AI 估算"备选 */}
            {query && results.length > 0 && !estimating && (
              <button
                onClick={() => askAIEstimate()}
                className="w-full text-xs py-2 mb-2 rounded-lg"
                style={{ background: "#EFE5F6", color: "#6B4F8F" }}
              >
                都不是？ ✨ 让 AI 估算 "{query}"
              </button>
            )}

            {/* 估算中 — 骨架屏 */}
            {estimating && (
              <div className="card p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-32 rounded animate-pulse" style={{ background: "var(--color-border-soft)" }} />
                    <div className="h-3 w-20 rounded animate-pulse" style={{ background: "var(--color-border-soft)" }} />
                  </div>
                  <div className="h-7 w-14 rounded animate-pulse" style={{ background: "var(--color-accent-soft)" }} />
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--color-border-soft)" }}>
                  <span className="text-base animate-pulse">✨</span>
                  <span className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
                    AI 正在按描述估算热量...
                  </span>
                </div>
              </div>
            )}

            {/* 估算失败 */}
            {aiBlocked && (
              <div className="card p-3 text-xs" style={{ color: "var(--color-warning)" }}>
                {aiBlocked}
              </div>
            )}
          </div>
        )}

        {/* 确认按钮 */}
        {picked && (
          <button
            onClick={submit}
            disabled={submitting}
            className="btn-primary w-full mt-4 shrink-0 disabled:opacity-40"
          >
            {submitting ? "记录中..." : (
              <>加入 <span className="num mx-1">{totalKcal}</span> kcal</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
