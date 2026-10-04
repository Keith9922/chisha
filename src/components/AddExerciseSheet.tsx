"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXERCISE_TYPES } from "@/lib/met";
import type { Intensity } from "@/lib/types";
import { useToast } from "./Toast";

const INTENSITIES: { id: Intensity; label: string }[] = [
  { id: "low", label: "轻松" },
  { id: "medium", label: "中等" },
  { id: "high", label: "拼了" },
];

export default function AddExerciseSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [type, setType] = useState(EXERCISE_TYPES[0].id);
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<Intensity>("medium");
  const [submitting, setSubmitting] = useState(false);
  const [performedTime, setPerformedTime] = useState<string>(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  });

  async function submit() {
    setSubmitting(true);
    const r = await fetch("/api/log-exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, duration_min: duration, intensity, performed_time: performedTime }),
    });
    if (r.ok) {
      const j = await r.json();
      router.refresh();
      onClose();
      toast.show(`已记 ${EXERCISE_TYPES.find(e => e.id === type)?.name ?? type} · 消耗 ${j.kcal} kcal`, "success");
    } else {
      setSubmitting(false);
      toast.show("记录失败，请重试", "error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(20, 15, 10, 0.32)", backdropFilter: "blur(2px)" }} />
      <div
        className="relative w-full max-w-[480px] rounded-t-3xl pb-6 px-5 pt-3"
        style={{ background: "var(--color-bg-app)", boxShadow: "0 -10px 40px rgba(40, 30, 20, 0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#D5CFC4" }} />
        <div className="text-base font-medium mb-4 px-1">
          添加 <span style={{ color: "var(--color-success)" }}>🏃 运动</span>
        </div>

        <div className="mb-4">
          <div className="section-title">类型</div>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto no-scrollbar">
            {EXERCISE_TYPES.map((ex) => {
              const active = ex.id === type;
              return (
                <button
                  key={ex.id}
                  onClick={() => setType(ex.id)}
                  className="rounded-2xl py-3 px-1 flex flex-col items-center gap-1 transition-all"
                  style={{
                    background: active ? "var(--color-success-soft)" : "var(--color-bg-card)",
                    border: `1px solid ${active ? "var(--color-success)" : "var(--color-border-soft)"}`,
                    color: active ? "var(--color-success)" : "var(--color-text-primary)",
                  }}
                >
                  <span className="text-xl">{ex.emoji}</span>
                  <span className="text-[10px]">{ex.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <div className="section-title">时长（分钟）</div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setDuration((d) => Math.max(5, d - 5))}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-base"
                style={{ background: "var(--color-bg-app)", borderColor: "var(--color-border)" }}
              >−</button>
              <span className="num text-3xl">{duration}</span>
              <button
                onClick={() => setDuration((d) => d + 5)}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-base"
                style={{ background: "var(--color-bg-app)", borderColor: "var(--color-border)" }}
              >+</button>
            </div>
            <div className="flex gap-2 mt-3">
              {[15, 30, 45, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className="flex-1 text-xs py-1.5 rounded-lg"
                  style={{
                    background: duration === d ? "var(--color-accent-soft)" : "var(--color-bg-app)",
                    color: duration === d ? "var(--color-accent)" : "var(--color-text-secondary)",
                  }}
                >
                  {d} 分
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="section-title">强度</div>
          <div className="grid grid-cols-3 gap-2">
            {INTENSITIES.map((i) => {
              const active = i.id === intensity;
              return (
                <button
                  key={i.id}
                  onClick={() => setIntensity(i.id)}
                  className="py-2.5 rounded-xl text-sm"
                  style={{
                    background: active ? "var(--color-accent-soft)" : "var(--color-bg-card)",
                    border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border-soft)"}`,
                    color: active ? "var(--color-accent)" : "var(--color-text-primary)",
                  }}
                >
                  {i.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5">
          <div className="section-title">时间</div>
          <div className="card p-3 flex items-center justify-between">
            <span className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>什么时候做的</span>
            <input
              type="time"
              value={performedTime}
              onChange={(e) => setPerformedTime(e.target.value)}
              className="num text-sm bg-transparent outline-none text-right"
              style={{ color: "var(--color-text-primary)" }}
            />
          </div>
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          className="btn-primary w-full disabled:opacity-40"
          style={{ background: "var(--color-success)", boxShadow: "0 6px 16px rgba(124, 169, 130, 0.25)" }}
        >
          {submitting ? "记录中..." : "记录运动"}
        </button>
      </div>
    </div>
  );
}
