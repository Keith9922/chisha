// 当日 day_id 计算 — 使用凌晨 02:00 作为切换点
// 例如 2026-05-07 02:00 至 2026-05-08 01:59 都属于 day_id = "2026-05-07"

export function dayIdOf(date: Date = new Date()): string {
  const d = new Date(date);
  // 如果当前时间在 00:00–01:59，向前归入前一天
  if (d.getHours() < 2) {
    d.setDate(d.getDate() - 1);
  }
  return formatDay(d);
}

export function formatDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 两点截止：返回今天的截止时刻（即第二天 02:00）
export function todayCutoff(date: Date = new Date()): Date {
  const dayId = dayIdOf(date);
  const [y, m, d] = dayId.split("-").map(Number);
  const cutoff = new Date(y, m - 1, d + 1, 2, 0, 0, 0);
  return cutoff;
}

// 距离睡眠的小时分钟（"04:25"）
export function timeUntilBedtime(bedtime: string, now: Date = new Date()): string {
  const [h, m] = bedtime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  const diffMs = target.getTime() - now.getTime();
  const totalMin = Math.max(0, Math.floor(diffMs / 60_000));
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${hours}:${String(mins).padStart(2, "0")}`;
}

export function greetingFor(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "夜深了 🌃";
  if (h < 11) return "早安 ☀";
  if (h < 14) return "中午好 🌞";
  if (h < 18) return "下午好 ☕";
  if (h < 22) return "晚上好 🌙";
  return "夜深了 🌃";
}
