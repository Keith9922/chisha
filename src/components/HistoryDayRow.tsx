"use client";

import { useEffect, useState } from "react";
import { MEAL_LABELS, type MealCategory } from "@/lib/types";
import SourceBadge from "./SourceBadge";

export interface DayRowData {
  day_id: string;
  isToday: boolean;
  hasData: boolean;
  intake_kcal: number;
  exercise_kcal: number;
  budget_kcal: number;
  remaining_kcal: number;
  met_goal: boolean;
  weekday: string;
  monthDay: string;
}

export interface DayRowMeal {
  meal: string;
  total: number;
  items: {
    id: number;
    name: string;
    brand: string | null;
    kcal: number;
    portion: number;
    source: string;
    reasoning: string | null;
  }[];
}

export interface DayRowExercise {
  id: number;
  type: string;
  duration_min: number;
  intensity: string;
  kcal_burned: number;
}

interface Props {
  day: DayRowData;
}

export default function HistoryDayRow({ day }: Props) {
  const [expanded, setExpanded] = useState(day.isToday);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<{ meals: DayRowMeal[]; exercises: DayRowExercise[] } | null>(null);

  const canExpand = day.hasData;

  async function loadDetail() {
    if (detail) return;
    setLoading(true);
    const r = await fetch(`/api/day-detail?day=${day.day_id}`);
    const j = await r.json();
    setDetail(j);
    setLoading(false);
  }

  async function toggle() {
    if (!canExpand) return;
    if (!expanded) await loadDetail();
    setExpanded((e) => !e);
  }

  // 周打卡 cell 点击 → focus 到本行并展开
  useEffect(() => {
    function onFocus(e: Event) {
      const detail = (e as CustomEvent).detail as { dayId: string };
      if (detail.dayId === day.day_id && canExpand && !expanded) {
        loadDetail().then(() => setExpanded(true));
      }
    }
    window.addEventListener("chisha:focus-day", onFocus);
    return () => window.removeEventListener("chisha:focus-day", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.day_id, canExpand, expanded]);

  const over = day.hasData && !day.met_goal;
  const titleText = day.isToday ? "今天" : `${day.monthDay} · 周${day.weekday}`;

  return (
    <div id={`day-${day.day_id}`} className="card overflow-hidden scroll-mt-4">
      <button
        onClick={toggle}
        disabled={!canExpand}
        className="w-full px-4 py-4 text-left disabled:cursor-default"
      >
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <span>{titleText}</span>
            {day.isToday && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
              >
                今日
              </span>
            )}
          </div>
          {day.hasData ? (
            <div
              className="text-[11px] px-2.5 py-0.5 rounded-lg font-medium"
              style={{
                background: over ? "var(--color-warning-soft)" : "var(--color-success-soft)",
                color: over ? "var(--color-warning)" : "var(--color-success)",
              }}
            >
              {over ? `超 +${-day.remaining_kcal}` : `余 ${day.remaining_kcal}`}
            </div>
          ) : day.isToday ? (
            <div
              className="text-[11px] px-2.5 py-0.5 rounded-lg font-medium"
              style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
            >
              余 {day.remaining_kcal}
            </div>
          ) : (
            <span className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
              没记录
            </span>
          )}
        </div>
        {(day.hasData || day.isToday) && (
          <div className="flex items-center gap-3.5 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
            <span>
              <span className="num font-medium" style={{ color: "var(--color-text-primary)" }}>
                {day.intake_kcal}
              </span>{" "}摄入
            </span>
            {day.exercise_kcal > 0 && (
              <span>
                <span className="num font-medium" style={{ color: "var(--color-success)" }}>
                  −{day.exercise_kcal}
                </span>{" "}消耗
              </span>
            )}
            <span style={{ color: "var(--color-text-tertiary)" }}>
              · 预算 <span className="num">{day.budget_kcal}</span>
            </span>
            {day.hasData && (
              <span className="ml-auto text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                {expanded ? "▲" : "▼"}
              </span>
            )}
          </div>
        )}
      </button>

      {expanded && day.hasData && (
        <div
          className="px-4 pb-4 pt-1 border-t"
          style={{ borderColor: "var(--color-border-soft)" }}
        >
          {loading && (
            <div className="space-y-2 py-2">
              <div className="h-3 w-20 rounded animate-pulse" style={{ background: "var(--color-border-soft)" }} />
              <div className="h-3 w-full rounded animate-pulse" style={{ background: "var(--color-border-soft)" }} />
              <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: "var(--color-border-soft)" }} />
            </div>
          )}
          {detail && (
            <>
              {detail.meals.map((m) => (
                <MealBlock key={m.meal} meal={m} />
              ))}
              {detail.exercises.length > 0 && <ExerciseBlock exercises={detail.exercises} />}
            </>
          )}
        </div>
      )}

      {expanded && !day.hasData && !day.isToday && (
        <div
          className="px-4 pb-4 pt-3 text-xs border-t text-center"
          style={{ color: "var(--color-text-tertiary)", borderColor: "var(--color-border-soft)" }}
        >
          这天没记录
        </div>
      )}
    </div>
  );
}

function MealBlock({ meal }: { meal: DayRowMeal }) {
  const label = MEAL_LABELS[meal.meal as MealCategory] ?? { name: meal.meal, emoji: "•" };
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center text-[12px] mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
        <span className="flex items-center gap-1.5">
          <span>{label.emoji}</span>
          <span>{label.name}</span>
        </span>
        <span className="num" style={{ color: "var(--color-accent)" }}>{meal.total}</span>
      </div>
      <div className="space-y-1 pl-5">
        {meal.items.map((it) => (
          <div key={it.id} className="flex justify-between items-center text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <span className="truncate" style={{ color: "var(--color-text-primary)" }}>
                {it.brand ? `${it.brand} · ` : ""}
                {it.name}
                {it.portion !== 1 && ` × ${it.portion}`}
              </span>
              <SourceBadge source={it.source} />
            </div>
            <span className="num shrink-0" style={{ color: "var(--color-text-primary)" }}>{it.kcal}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExerciseBlock({ exercises }: { exercises: DayRowExercise[] }) {
  const total = exercises.reduce((s, e) => s + e.kcal_burned, 0);
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center text-[12px] mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
        <span className="flex items-center gap-1.5">
          <span>🏃</span>
          <span>运动</span>
        </span>
        <span className="num" style={{ color: "var(--color-success)" }}>−{total}</span>
      </div>
      <div className="space-y-1 pl-5">
        {exercises.map((e) => (
          <div key={e.id} className="flex justify-between items-center text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
            <span className="truncate pr-2" style={{ color: "var(--color-text-primary)" }}>
              {e.type} · {e.duration_min} 分钟
            </span>
            <span className="num shrink-0" style={{ color: "var(--color-success)" }}>−{e.kcal_burned}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
