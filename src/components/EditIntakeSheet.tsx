"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MEAL_LABELS, type MealCategory } from "@/lib/types";
import { useToast } from "./Toast";

interface IntakeRowMin {
  id: number;
  name: string;
  brand: string | null;
  meal: string;
  kcal: number;
  portion: number;
  consumed_at: string;
}

const MEAL_OPTIONS: MealCategory[] = ["breakfast", "lunch", "dinner", "snack"];

export default function EditIntakeSheet({
  item,
  onClose,
}: {
  item: IntakeRowMin;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [portion, setPortion] = useState(item.portion);
  const [meal, setMeal] = useState<MealCategory>(item.meal as MealCategory);
  const [time, setTime] = useState<string>(() => {
    const d = new Date(item.consumed_at);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [saving, setSaving] = useState(false);

  // 单位份量热量
  const unitKcal = item.portion > 0 ? item.kcal / item.portion : item.kcal;
  const newKcal = Math.round(unitKcal * portion);

  async function save() {
    setSaving(true);
    const r = await fetch("/api/log-food", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, portion, meal, consumed_time: time }),
    });
    setSaving(false);
    if (r.ok) {
      router.refresh();
      onClose();
      toast.show("已更新", "success");
    } else {
      const j = await r.json().catch(() => ({}));
      toast.show(j.error ?? "保存失败", "error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="absolute inset-0"
        style={{ background: "rgba(20, 15, 10, 0.32)", backdropFilter: "blur(2px)" }}
      />
      <div
        className="relative w-full max-w-[480px] rounded-t-3xl pb-6 px-5 pt-3"
        style={{ background: "var(--color-bg-app)", boxShadow: "0 -10px 40px rgba(40, 30, 20, 0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#D5CFC4" }} />
        <div className="text-base font-medium mb-1 px-1">编辑</div>
        <div className="text-xs mb-4 px-1" style={{ color: "var(--color-text-secondary)" }}>
          {item.brand ? `${item.brand} · ` : ""}{item.name}
        </div>

        <div className="card p-4 mb-3">
          <div className="flex justify-between items-center">
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
          <div className="flex justify-between items-center pt-3 mt-3 border-t" style={{ borderColor: "var(--color-border-soft)" }}>
            <span className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>新热量</span>
            <span className="num text-lg" style={{ color: "var(--color-accent)" }}>{newKcal} kcal</span>
          </div>
        </div>

        <div className="card p-4 mb-3 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>归到</span>
            <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--color-bg-app)" }}>
              {MEAL_OPTIONS.map((m) => {
                const active = m === meal;
                return (
                  <button
                    key={m}
                    onClick={() => setMeal(m)}
                    className="text-xs px-2.5 py-1 rounded-md transition-all"
                    style={{
                      background: active ? "var(--color-bg-card)" : "transparent",
                      color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {MEAL_LABELS[m].emoji}{MEAL_LABELS[m].name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: "var(--color-border-soft)" }}>
            <span className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>时间</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="num text-sm bg-transparent outline-none text-right"
              style={{ color: "var(--color-text-primary)" }}
            />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="btn-primary w-full disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存修改"}
        </button>
      </div>
    </div>
  );
}
