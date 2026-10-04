import type { TodayStatus } from "@/lib/today-status";

export default function Dashboard({ status }: { status: TodayStatus }) {
  const totalMacroG =
    status.intake_protein_g + status.intake_carb_g + status.intake_fat_g || 1;
  const carbPct = Math.round(((status.intake_carb_g * 4) / Math.max(status.intake_kcal, 1)) * 100);
  const protPct = Math.round(((status.intake_protein_g * 4) / Math.max(status.intake_kcal, 1)) * 100);
  const fatPct = Math.round(((status.intake_fat_g * 9) / Math.max(status.intake_kcal, 1)) * 100);

  const fillPct = status.pct_consumed;
  const over = status.remaining_kcal < 0;
  const numColor = over ? "var(--color-warning)" : "var(--color-accent)";

  return (
    <div className="card-lg p-7 mb-6">
      <div className="text-center">
        <div className="num text-6xl leading-none" style={{ color: numColor }}>
          {Math.abs(status.remaining_kcal).toLocaleString()}
          <span className="text-base ml-1" style={{ color: "var(--color-text-tertiary)" }}>
            / {status.budget_kcal.toLocaleString()}
          </span>
        </div>
        <div className="h-1.5 rounded-full mt-4 mb-3 overflow-hidden"
             style={{ background: "var(--color-accent-soft)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(fillPct, 100)}%`,
              background: over ? "var(--color-warning)" : "var(--color-accent)",
            }}
          />
        </div>
        <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          {over ? "超标" : "今日剩余"} (kcal)
          {status.exercise_kcal > 0 && (
            <span> · 含运动 +{status.exercise_kcal}</span>
          )}
        </div>
      </div>

      <div
        className="grid grid-cols-3 gap-2 my-5 py-4 border-y"
        style={{ borderColor: "var(--color-border-soft)" }}
      >
        <div className="text-center">
          <div className="num text-base">
            {status.intake_protein_g}
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              /{status.protein_target_g}g
            </span>
          </div>
          <div className="text-[10px] mt-1.5 tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
            蛋白质
          </div>
        </div>
        <div className="text-center">
          <div className="num text-base" style={{ color: status.exercise_kcal > 0 ? "var(--color-success)" : undefined }}>
            {status.exercise_kcal > 0 ? `−${status.exercise_kcal}` : "0"}
          </div>
          <div className="text-[10px] mt-1.5 tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
            运动消耗
          </div>
        </div>
        <div className="text-center">
          <div className="num text-base">{status.time_until_bedtime}</div>
          <div className="text-[10px] mt-1.5 tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
            距睡眠
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <MacroRow label="碳水" pct={carbPct} color="var(--color-carb)" />
        <MacroRow label="蛋白" pct={protPct} color="var(--color-success)" />
        <MacroRow label="脂肪" pct={fatPct} color="var(--color-accent)" />
      </div>
    </div>
  );
}

function MacroRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-7" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border-soft)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <span className="num text-xs w-9 text-right">{pct}%</span>
    </div>
  );
}
