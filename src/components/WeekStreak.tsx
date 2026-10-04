"use client";

// 本周达标 + 7 个格子。点击格子滚动到日历列表对应行并触发展开。
import type { DayHistory } from "@/lib/today-status";

interface Props {
  todayId: string;
  days: { id: string; weekday: string; dayNum: number; isToday: boolean }[];
  byId: Map<string, DayHistory>;
  metCount: number;
  streak?: number;
  summaryNode?: React.ReactNode;
}

export default function WeekStreak({ todayId, days, byId, metCount, streak, summaryNode }: Props) {
  function jumpTo(dayId: string) {
    const target = document.getElementById(`day-${dayId}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    // 触发自定义事件，让对应的 HistoryDayRow 自动展开
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("chisha:focus-day", { detail: { dayId } }));
    }, 200);
  }

  return (
    <div className="card-lg p-5 mb-4">
      <div className="flex justify-between items-baseline mb-4">
        <h3 className="text-[13px] font-medium tracking-wide flex items-baseline gap-2" style={{ color: "var(--color-text-secondary)" }}>
          <span>本周达标</span>
          {streak !== undefined && streak >= 2 && (
            <span className="text-[11px] flex items-center gap-0.5" style={{ color: "var(--color-warning)" }}>
              🔥 <span className="num font-medium">{streak}</span> 连
            </span>
          )}
        </h3>
        <div>
          <span className="num text-2xl" style={{ color: "var(--color-success)" }}>
            {metCount}
          </span>
          <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            {" "}/ 7 天
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const data = byId.get(d.id);
          const isToday = d.id === todayId;
          const status = !data ? "empty" : data.met_goal ? "met" : "over";
          const bg =
            isToday ? "var(--color-accent)"
            : status === "met" ? "var(--color-success-soft)"
            : status === "over" ? "var(--color-warning-soft)"
            : "var(--color-border-soft)";
          const fg =
            isToday ? "white"
            : status === "met" ? "var(--color-success)"
            : status === "over" ? "var(--color-warning)"
            : "var(--color-text-secondary)";
          return (
            <button
              key={d.id}
              onClick={() => jumpTo(d.id)}
              className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-[9px] transition-transform active:scale-95"
              style={{
                background: bg,
                color: fg,
                boxShadow: isToday ? "0 4px 12px rgba(233, 122, 69, 0.3)" : undefined,
              }}
              title={
                d.id +
                (data
                  ? ` · 摄入 ${data.intake_kcal} · ${data.met_goal ? "达标" : "超标"}`
                  : " · 没记录")
              }
            >
              <span>{d.weekday}</span>
              <span className="num text-sm">{d.dayNum}</span>
            </button>
          );
        })}
      </div>
      {summaryNode}
    </div>
  );
}
