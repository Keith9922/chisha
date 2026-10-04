"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MEAL_LABELS, type MealCategory } from "@/lib/types";
import AddFoodSheet from "./AddFoodSheet";
import EditIntakeSheet from "./EditIntakeSheet";
import SourceBadge from "./SourceBadge";
import { useToast } from "./Toast";

export interface IntakeRow {
  id: number;
  name: string;
  brand: string | null;
  meal: string;
  kcal: number;
  portion: number;
  confidence: string;
  source: string;
  reasoning: string | null;
  consumed_at: string;
}

const ORDER: MealCategory[] = ["breakfast", "lunch", "dinner", "snack"];

export default function MealSection({ intakes }: { intakes: IntakeRow[] }) {
  const [openMeal, setOpenMeal] = useState<MealCategory | null>(null);

  const grouped = ORDER.map((meal) => ({
    meal,
    items: intakes.filter((i) => i.meal === meal),
    total: intakes.filter((i) => i.meal === meal).reduce((s, i) => s + i.kcal, 0),
  }));

  return (
    <section className="mb-6">
      <h3 className="section-title">今日餐次</h3>
      <div className="space-y-2.5">
        {grouped.map((g) => (
          <MealCard
            key={g.meal}
            meal={g.meal}
            items={g.items}
            total={g.total}
            onAdd={() => setOpenMeal(g.meal)}
          />
        ))}
      </div>
      {openMeal && <AddFoodSheet meal={openMeal} onClose={() => setOpenMeal(null)} />}
    </section>
  );
}

function MealCard({
  meal,
  items,
  total,
  onAdd,
}: {
  meal: MealCategory;
  items: IntakeRow[];
  total: number;
  onAdd: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [showReasoning, setShowReasoning] = useState<number | null>(null);
  const [editing, setEditing] = useState<IntakeRow | null>(null);
  const label = MEAL_LABELS[meal];
  const empty = items.length === 0;

  async function deleteItem(id: number, name: string) {
    if (!(await toast.confirm(`删除 "${name}"?`))) return;
    const r = await fetch(`/api/log-food?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      router.refresh();
      toast.show("已删除", "info");
    } else {
      toast.show("删除失败", "error");
    }
  }

  if (empty) {
    return (
      <button
        onClick={onAdd}
        className="card-empty w-full px-4 py-4 flex items-center justify-between text-left"
      >
        <span className="text-sm flex items-center gap-2.5" style={{ color: "var(--color-text-tertiary)" }}>
          <span className="text-base">{label.emoji}</span>
          {label.name} · 待记录
        </span>
        <span className="text-lg font-light" style={{ color: "var(--color-text-tertiary)" }}>+</span>
      </button>
    );
  }

  const firstTime = new Date(items.map((i) => i.consumed_at).sort()[0]).toLocaleTimeString("zh-CN", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  return (
    <div className="card px-4 py-4">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium flex items-center gap-2.5">
          <span className="text-base">{label.emoji}</span>
          <span>{label.name} · {firstTime}</span>
        </div>
        <div className="num text-lg" style={{ color: "var(--color-accent)" }}>{total}</div>
      </div>
      <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "var(--color-border-soft)" }}>
        {items.map((it) => {
          const expanded = showReasoning === it.id;
          return (
            <div key={it.id}>
              <div className="flex justify-between items-start text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
                <button
                  className="flex-1 text-left flex items-center gap-1.5 flex-wrap min-w-0 pr-2"
                  onClick={() => it.reasoning && setShowReasoning(expanded ? null : it.id)}
                >
                  <span className="truncate" style={{ color: "var(--color-text-primary)" }}>
                    {it.brand ? `${it.brand} · ` : ""}
                    {it.name}
                    {it.portion !== 1 && ` × ${it.portion}`}
                  </span>
                  <SourceBadge source={it.source} />
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="num" style={{ color: "var(--color-text-primary)" }}>{it.kcal}</span>
                  <button
                    onClick={() => setEditing(it)}
                    className="text-[11px] opacity-40 hover:opacity-100 transition-opacity"
                    title="编辑"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteItem(it.id, it.name)}
                    className="text-[10px] opacity-40 hover:opacity-100 transition-opacity"
                    title="删除"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {expanded && it.reasoning && (
                <div
                  className="text-[11px] mt-1.5 px-2.5 py-2 rounded-lg leading-relaxed"
                  style={{ background: "#EFE5F6", color: "#6B4F8F" }}
                >
                  💡 {it.reasoning}
                </div>
              )}
            </div>
          );
        })}
        <button
          onClick={onAdd}
          className="text-xs pt-1 hover:opacity-70"
          style={{ color: "var(--color-accent)" }}
        >
          + 再加一项
        </button>
      </div>
      {editing && (
        <EditIntakeSheet item={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
