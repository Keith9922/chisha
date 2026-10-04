"use client";

// 记录页底部小卡：今日体重 + 与上次的差值。点击展开输入框。
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";

interface WeightEntry {
  id: number;
  day_id: string;
  weight_kg: number;
}

export default function WeightCard({ initialWeightKg }: { initialWeightKg: number }) {
  const router = useRouter();
  const toast = useToast();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState<string>(initialWeightKg.toFixed(1));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/weight?limit=14")
      .then((r) => r.json())
      .then((j) => setEntries(j.entries ?? []))
      .finally(() => setLoading(false));
  }, []);

  const today = entries[0];
  const prev = entries[1];
  const lastWeek = entries.find((e) => {
    const target = Date.now() - 7 * 86400_000;
    return new Date(e.day_id + "T12:00:00").getTime() <= target;
  });

  async function save() {
    const w = parseFloat(input);
    if (!w || w < 20 || w > 300) {
      toast.show("体重值不合理 (20-300kg)", "error");
      return;
    }
    setSaving(true);
    const r = await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight_kg: w }),
    });
    setSaving(false);
    if (r.ok) {
      // refetch
      const j = await fetch("/api/weight?limit=14").then((r) => r.json());
      setEntries(j.entries ?? []);
      setExpanded(false);
      toast.show("已记今日体重", "success");
      router.refresh(); // dashboard / TDEE 也要更新
    } else {
      toast.show("保存失败", "error");
    }
  }

  // 当前显示用：今日已记 → 用今日；否则用 profile 的体重
  const displayWeight = today?.weight_kg ?? initialWeightKg;
  const deltaSinceLast = today && prev ? today.weight_kg - prev.weight_kg : null;
  const deltaSince7d = today && lastWeek ? today.weight_kg - lastWeek.weight_kg : null;

  if (loading) {
    return (
      <section className="mb-6">
        <h3 className="section-title">体重</h3>
        <div className="card p-4 flex justify-between items-center">
          <div className="h-7 w-24 rounded animate-pulse" style={{ background: "var(--color-border-soft)" }} />
          <div className="h-4 w-16 rounded animate-pulse" style={{ background: "var(--color-border-soft)" }} />
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <h3 className="section-title flex items-center justify-between">
        <span>体重</span>
        {!today && (
          <span className="normal-case tracking-normal" style={{ color: "var(--color-accent)" }}>
            今天还没记
          </span>
        )}
      </h3>
      <div className="card p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-baseline gap-1 text-left"
          >
            <span className="num text-2xl">{displayWeight.toFixed(1)}</span>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>kg</span>
            {!today && (
              <span className="text-[10px] ml-1.5" style={{ color: "var(--color-text-tertiary)" }}>
                · profile 默认值
              </span>
            )}
          </button>

          <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
            {deltaSinceLast !== null && (
              <Delta label="vs 上次" v={deltaSinceLast} />
            )}
            {deltaSince7d !== null && deltaSince7d !== deltaSinceLast && (
              <Delta label="vs 7d" v={deltaSince7d} />
            )}
            {!today && (
              <button
                onClick={() => setExpanded(true)}
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: "var(--color-accent-soft)", color: "var(--color-accent)" }}
              >
                + 记一下
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--color-border-soft)" }}>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                inputMode="decimal"
                className="num text-2xl bg-transparent outline-none flex-1 border-b py-1"
                style={{ borderColor: "var(--color-border)" }}
                autoFocus
              />
              <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>kg</span>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                style={{ background: "var(--color-accent)", color: "white" }}
              >
                {saving ? "保存中" : "保存"}
              </button>
            </div>
            <div className="text-[10px] mt-2" style={{ color: "var(--color-text-tertiary)" }}>
              记完后 profile 体重会自动更新，TDEE 也会跟着调整
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Delta({ label, v }: { label: string; v: number }) {
  if (Math.abs(v) < 0.05) {
    return (
      <span style={{ color: "var(--color-text-tertiary)" }}>
        {label} <span className="num">±0</span>
      </span>
    );
  }
  const down = v < 0;
  const color = down ? "var(--color-success)" : "var(--color-warning)";
  const arrow = down ? "↓" : "↑";
  return (
    <span style={{ color }}>
      {label}{" "}
      <span className="num font-medium">
        {arrow}{Math.abs(v).toFixed(1)}
      </span>
    </span>
  );
}
