"use client";

// 体重趋势图（手写 SVG）— 显示在历史页
import { useEffect, useState } from "react";

interface WeightEntry {
  id: number;
  day_id: string;
  weight_kg: number;
}

export default function WeightTrendChart() {
  const [entries, setEntries] = useState<WeightEntry[] | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/weight?limit=60")
      .then((r) => r.json())
      .then((j) => setEntries(j.entries ?? []));
  }, []);

  if (entries === null) return null;
  if (entries.length === 0) {
    return (
      <div className="card-empty p-5 mb-6 text-center text-xs" style={{ color: "var(--color-text-tertiary)" }}>
        还没记过体重 — 在记录页底部加一次
      </div>
    );
  }

  // 升序展示 (oldest left → newest right)
  const sorted = [...entries].sort((a, b) => a.day_id.localeCompare(b.day_id));
  const min = Math.min(...sorted.map((e) => e.weight_kg));
  const max = Math.max(...sorted.map((e) => e.weight_kg));
  const pad = Math.max(0.5, (max - min) * 0.15);
  const yMin = min - pad;
  const yMax = max + pad;
  const yRange = yMax - yMin || 1;

  const W = 320;
  const H = 110;
  const PAD_L = 8;
  const PAD_R = 8;
  const PAD_T = 10;
  const PAD_B = 18;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const points = sorted.map((e, i) => {
    const x = PAD_L + (sorted.length === 1 ? innerW / 2 : (i / (sorted.length - 1)) * innerW);
    const y = PAD_T + (1 - (e.weight_kg - yMin) / yRange) * innerH;
    return { x, y, ...e };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${PAD_T + innerH} L ${points[0].x} ${PAD_T + innerH} Z`;

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const delta = last.weight_kg - first.weight_kg;
  const days = sorted.length;
  const down = delta < 0;

  return (
    <div className="card-lg p-5 mb-6">
      <div className="flex justify-between items-baseline mb-3">
        <h3 className="text-[13px] font-medium tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
          体重 · 最近 {days} 条
        </h3>
        <div className="text-[11px] flex items-baseline gap-1">
          {Math.abs(delta) < 0.05 ? (
            <span className="num" style={{ color: "var(--color-text-tertiary)" }}>±0 kg</span>
          ) : (
            <>
              <span className="num font-medium" style={{ color: down ? "var(--color-success)" : "var(--color-warning)" }}>
                {down ? "↓" : "↑"}
                {Math.abs(delta).toFixed(1)}
              </span>
              <span style={{ color: "var(--color-text-tertiary)" }}>kg</span>
            </>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        <defs>
          <linearGradient id="wt-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {points.length > 1 && <path d={areaD} fill="url(#wt-area)" />}
        {points.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {points.map((p) => (
          <g key={p.id} onMouseEnter={() => setHovered(p.id)} onMouseLeave={() => setHovered(null)} onClick={() => setHovered(hovered === p.id ? null : p.id)} style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r="8" fill="transparent" />
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === p.id ? 4 : 2.5}
              fill="var(--color-accent)"
              stroke="white"
              strokeWidth="1.5"
            />
            {hovered === p.id && (
              <>
                <rect
                  x={Math.max(2, Math.min(W - 50, p.x - 24))}
                  y={Math.max(2, p.y - 26)}
                  width="48"
                  height="20"
                  rx="4"
                  fill="var(--color-text-primary)"
                />
                <text
                  x={Math.max(2, Math.min(W - 50, p.x - 24)) + 24}
                  y={Math.max(2, p.y - 26) + 14}
                  fontSize="10"
                  fill="white"
                  textAnchor="middle"
                  fontFamily="ui-serif, Georgia"
                >
                  {p.weight_kg.toFixed(1)}
                </text>
              </>
            )}
          </g>
        ))}
        {/* X 轴端点标 */}
        <text x={PAD_L} y={H - 4} fontSize="9" fill="var(--color-text-tertiary)">
          {fmtDate(first.day_id)}
        </text>
        <text x={W - PAD_R} y={H - 4} fontSize="9" fill="var(--color-text-tertiary)" textAnchor="end">
          {fmtDate(last.day_id)}
        </text>
      </svg>
    </div>
  );
}

function fmtDate(d: string): string {
  const [, m, day] = d.split("-");
  return `${parseInt(m)}/${parseInt(day)}`;
}
