import { getRecentDays, calcCurrentStreak } from "@/lib/today-status";
import { dayIdOf } from "@/lib/today";
import { requireProfile } from "@/lib/page-guard";
import HistoryDayRow from "@/components/HistoryDayRow";
import WeekChart from "@/components/WeekChart";
import WeekStreak from "@/components/WeekStreak";
import WeightTrendChart from "@/components/WeightTrendChart";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const { userId, profile } = await requireProfile();

  const days = await getRecentDays(userId, 30);
  const today = dayIdOf();
  const byId = new Map(days.map((d) => [d.day_id, d]));

  const week = lastNDays(7, today);
  const weekRecorded = week.filter((d) => byId.has(d.id) && d.id !== today);
  const weekMet = weekRecorded.filter((d) => byId.get(d.id)?.met_goal);
  const streak = calcCurrentStreak(days, today);

  const recordedPast = days.filter((d) => d.day_id !== today);
  const totalIntake = recordedPast.reduce((s, d) => s + d.intake_kcal, 0);
  const avgIntake = recordedPast.length > 0 ? Math.round(totalIntake / recordedPast.length) : 0;
  const netDeficit = recordedPast.reduce(
    (s, d) => s + (d.budget_kcal + d.exercise_kcal - d.intake_kcal),
    0
  );
  const avgDeficit = recordedPast.length > 0 ? Math.round(netDeficit / recordedPast.length) : 0;

  const todayRow = days.find((d) => d.day_id === today);
  const pastRows = days.filter((d) => d.day_id !== today);
  const todayRowData = todayRow ?? {
    day_id: today,
    intake_kcal: 0,
    exercise_kcal: 0,
    budget_kcal: profile.budget_kcal,
    remaining_kcal: profile.budget_kcal,
    met_goal: true,
  };
  const allRows = [todayRowData, ...pastRows];

  const summary = recordedPast.length > 0 ? (
    <div className="text-[11px] mt-3 text-center leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
      近 {recordedPast.length} 天平均摄入{" "}
      <span className="num font-medium" style={{ color: "var(--color-text-primary)" }}>{avgIntake}</span>{" "}
      kcal/天 ·{" "}
      {netDeficit >= 0 ? (
        <>
          合计净缺口{" "}
          <span className="num font-medium" style={{ color: "var(--color-success)" }}>−{netDeficit}</span>{" "}
          kcal
          {avgDeficit >= 100 && (
            <>
              {" "}· 约可减{" "}
              <span className="num font-medium" style={{ color: "var(--color-success)" }}>
                {(netDeficit / 7700).toFixed(1)}
              </span>{" "}
              kg 脂肪
            </>
          )}
        </>
      ) : (
        <>
          合计净超{" "}
          <span className="num font-medium" style={{ color: "var(--color-warning)" }}>+{-netDeficit}</span>{" "}
          kcal
        </>
      )}
    </div>
  ) : (
    <div className="text-[11px] mt-3 text-center" style={{ color: "var(--color-text-tertiary)" }}>
      今天开个好头吧
    </div>
  );

  return (
    <div className="px-5">
      <div className="px-1 pb-6 pt-3">
        <h2 className="text-2xl font-light tracking-tight">我的记录</h2>
      </div>

      <WeekStreak
        todayId={today}
        days={week}
        byId={byId}
        metCount={weekMet.length}
        streak={streak}
        summaryNode={summary}
      />

      <WeekChart budget={profile.budget_kcal} days={week} byId={byId} />

      <WeightTrendChart />

      <h3 className="section-title">每天详情</h3>
      <div className="space-y-2.5 pb-6">
        {allRows.map((d) => {
          const date = new Date(d.day_id + "T12:00:00");
          const weekday = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
          const monthDay = `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
          return (
            <HistoryDayRow
              key={d.day_id}
              day={{
                day_id: d.day_id,
                isToday: d.day_id === today,
                hasData: d.intake_kcal > 0 || d.exercise_kcal > 0,
                intake_kcal: d.intake_kcal,
                exercise_kcal: d.exercise_kcal,
                budget_kcal: d.budget_kcal,
                remaining_kcal: d.remaining_kcal,
                met_goal: d.met_goal,
                weekday,
                monthDay,
              }}
            />
          );
        })}
        {allRows.length === 1 && allRows[0].intake_kcal === 0 && (
          <div className="card-empty p-8 text-center">
            <div className="text-3xl mb-3">📝</div>
            <div className="text-sm mb-2" style={{ color: "var(--color-text-secondary)" }}>
              还没记录过
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              去记录页加几条，明天这里就有数据了
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function lastNDays(n: number, todayId: string) {
  const [y, m, d] = todayId.split("-").map(Number);
  const baseDate = new Date(y, m - 1, d);
  const arr: { id: string; weekday: string; dayNum: number; isToday: boolean }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(baseDate);
    dt.setDate(baseDate.getDate() - i);
    const id = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    const weekday = ["日", "一", "二", "三", "四", "五", "六"][dt.getDay()];
    arr.push({ id, weekday, dayNum: dt.getDate(), isToday: id === todayId });
  }
  return arr;
}
