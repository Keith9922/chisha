"use client";

// 7 天热量 mini chart：每天一个柱，柱高=摄入 / 预算的比例。
// 超标时红色，达标时蜜橘，未记录时灰色。点击/触摸柱子显示具体热量。
import { useState } from "react";
import type { DayHistory } from "@/lib/today-status";

interface Props {
  budget: number;
  days: { id: string; weekday: string; dayNum: number; isToday: boolean }[];
  byId: Map<string, DayHistory>;
}

export default function WeekChart({ budget, days, byId }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 找出最大值用于归一化（至少跟预算一样大，避免短柱看不清）
  const max = Math.max(
    budget * 1.2,
    ...days.map((d) => byId.get(d.id)?.intake_kcal ?? 0)
  );

  return (
    <div className="card-lg p-5 mb-6">
      <div className="flex justify-between items-baseline mb-3">
        <h3 className="text-[13px] font-medium tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
          本周热量
        </h3>
        <div className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
          预算 <span className="num">{budget}</span> kcal/日
        </div>
      </div>

      <div className="relative h-32 flex items-end justify-between gap-2 pt-2">
        {/* 预算横线 */}
        <div
          className="absolute left-0 right-0 border-t border-dashed pointer-events-none"
          style={{
            borderColor: "var(--color-text-tertiary)",
            opacity: 0.35,
            bottom: `${(budget / max) * 100}%`,
          }}
        >
          <span
            className="absolute -top-3 right-0 text-[9px]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            预算
          </span>
        </div>

        {days.map((d) => {
          const data = byId.get(d.id);
          const intake = data?.intake_kcal ?? 0;
          const heightPct = max > 0 ? Math.min(100, (intake / max) * 100) : 0;
          const over = data && !data.met_goal;
          const color = !data
            ? "var(--color-border)"
            : over
              ? "var(--color-warning)"
              : "var(--color-accent)";
          const isHovered = hoveredId === d.id;
          return (
            <button
              key={d.id}
              onMouseEnter={() => setHoveredId(d.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setHoveredId(isHovered ? null : d.id)}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end relative"
            >
              {/* hover 时显示数字 */}
              {isHovered && data && (
                <div
                  className="absolute z-10 px-2 py-1 rounded-md whitespace-nowrap text-[10px] num pointer-events-none"
                  style={{
                    background: "var(--color-text-primary)",
                    color: "white",
                    bottom: `${Math.max(heightPct, 3) + 6}%`,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  {intake} kcal
                </div>
              )}
              <div
                className="w-full rounded-md transition-all relative"
                style={{
                  height: data ? `${Math.max(heightPct, 3)}%` : "4px",
                  background: color,
                  opacity: d.isToday ? 1 : isHovered ? 1 : 0.85,
                  boxShadow: isHovered ? `0 4px 12px ${color}55` : undefined,
                }}
              >
                {d.isToday && (
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--color-accent)" }}
                  />
                )}
              </div>
              <div
                className="text-[9px] text-center"
                style={{ color: d.isToday ? "var(--color-accent)" : "var(--color-text-tertiary)" }}
              >
                {d.weekday}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
