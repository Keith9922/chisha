"use client";

import { useState } from "react";
import AddExerciseSheet from "./AddExerciseSheet";

export interface ExerciseRow {
  id: number;
  type: string;
  duration_min: number;
  intensity: string;
  kcal_burned: number;
  performed_at: string;
}

const INTENSITY_LABEL: Record<string, string> = {
  low: "低强度",
  medium: "中强度",
  high: "高强度",
};

export default function ExerciseSection({ exercises }: { exercises: ExerciseRow[] }) {
  const [open, setOpen] = useState(false);
  const total = exercises.reduce((s, e) => s + e.kcal_burned, 0);

  return (
    <section className="mb-6">
      <h3 className="section-title">今日运动</h3>
      <div className="space-y-2.5">
        {exercises.length > 0 && (
          <div className="card px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium flex items-center gap-2.5">
                <span className="text-base">🏃</span>
                <span>今日运动 · {exercises.length} 项</span>
              </div>
              <div className="num text-lg" style={{ color: "var(--color-success)" }}>−{total}</div>
            </div>
            <div className="mt-3 pt-3 border-t space-y-1.5" style={{ borderColor: "var(--color-border-soft)" }}>
              {exercises.map((ex) => {
                const time = new Date(ex.performed_at).toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
                return (
                  <div key={ex.id} className="flex justify-between text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
                    <span className="truncate pr-2">
                      {ex.type} · {ex.duration_min} 分钟 · {INTENSITY_LABEL[ex.intensity] ?? ex.intensity} · {time}
                    </span>
                    <span className="num shrink-0" style={{ color: "var(--color-success)" }}>−{ex.kcal_burned}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => setOpen(true)}
          className="card-empty w-full px-4 py-4 flex items-center justify-between text-left"
        >
          <span className="text-sm flex items-center gap-2.5" style={{ color: "var(--color-text-tertiary)" }}>
            <span className="text-base">＋</span>
            添加运动
          </span>
          <span className="text-lg font-light" style={{ color: "var(--color-text-tertiary)" }}>+</span>
        </button>
      </div>
      {open && <AddExerciseSheet onClose={() => setOpen(false)} />}
    </section>
  );
}
