import Link from "next/link";

export const metadata = {
  title: "关于 · 吃啥",
};

export default function AboutPage() {
  return (
    <div className="px-5 pb-12 pt-3">
      <div className="flex items-center justify-between pb-6 px-1">
        <Link href="/settings" className="text-sm" style={{ color: "var(--color-accent)" }}>
          ← 返回
        </Link>
        <h2 className="text-base font-medium">关于</h2>
        <div className="w-12" />
      </div>

      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🍊</div>
        <h1 className="text-3xl font-light mb-1">吃啥</h1>
        <div className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>chisha · v1</div>
      </div>

      <Section title="这是个啥">
        <p>给一二线城市白领的极简饮食管理。</p>
        <p>核心三件事：<strong>看见今日剩多少 · 一句话记录 · 想吃啥就问 AI</strong>。</p>
      </Section>

      <Section title="跟其他 App 有啥不一样">
        <ul className="space-y-2 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
          <li>📊 <strong>仪表盘永远在那</strong>。今日剩余热量 1 秒能看到，不用翻页。</li>
          <li>💬 <strong>真对话式记录</strong>。"我吃了一份西红柿炒蛋盖饭"，AI 自己查、自己记。</li>
          <li>🏷 <strong>每条数据都标来源</strong>。麦当劳官网、中国食物成分表、AI 估算 —— 让你心里有数。</li>
          <li>🌙 <strong>凌晨吐槽</strong>。深夜想吃泡面？AI 会给你算超标比例，最后说"真要吃就吃，我不拦你"。</li>
        </ul>
      </Section>

      <Section title="数据来源标签">
        <ul className="space-y-1.5 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
          <li><Badge color="green">官方</Badge> 来自品牌官网/官方营养计算器（最准）</li>
          <li><Badge color="green">包装</Badge> 来自包装食品的标签（同样准）</li>
          <li><Badge color="blue">标准</Badge> 来自《中国食物成分表》（家常食材）</li>
          <li><Badge color="purple">AI</Badge> AI 根据描述估算（中等准确度，能看到怎么算的）</li>
          <li><Badge color="grey">估算</Badge> 数据库内估算值（连锁品牌没公布官方数据时用）</li>
        </ul>
      </Section>

      <Section title="工作原理">
        <ol className="space-y-1.5 text-[13px] list-decimal pl-5" style={{ color: "var(--color-text-secondary)" }}>
          <li>用 Mifflin-St Jeor 公式根据你的身高/体重/活动量算出每日基础代谢 TDEE</li>
          <li>按目标（减脂 / 维持 / 增肌）调整出每日热量预算</li>
          <li>记录每一项摄入（食物 565+ 条 + AI 估算）和消耗（19 种运动 MET 值）</li>
          <li>实时算出剩余 = 预算 + 运动消耗 − 已吃</li>
          <li>02:00 凌晨为当日截止</li>
        </ol>
      </Section>

      <Section title="隐私">
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          每个浏览器一份独立数据，存在云端 SQLite。你跟 AI 的对话、饮食记录只有你自己看得到。
          想清空数据？去<Link href="/settings" style={{ color: "var(--color-accent)" }}>设置</Link>页底部。
        </p>
      </Section>

      <Section title="技术">
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Next.js 16 · Tailwind 4 · MiniMax-M2 · Prisma + libSQL · 部署在 Vercel
        </p>
      </Section>

      <div className="text-center mt-12 text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
        Made with 🍊
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <h3 className="section-title">{title}</h3>
      <div className="card p-4 text-[13px] leading-relaxed space-y-2" style={{ color: "var(--color-text-secondary)" }}>
        {children}
      </div>
    </div>
  );
}

function Badge({ color, children }: { color: "green" | "blue" | "purple" | "grey"; children: React.ReactNode }) {
  const styles = {
    green:  { bg: "var(--color-success-soft)", fg: "var(--color-success)" },
    blue:   { bg: "#E5EAF6",                    fg: "#5C7AC4" },
    purple: { bg: "#EFE5F6",                    fg: "#8E5CC4" },
    grey:   { bg: "var(--color-border-soft)",  fg: "var(--color-text-secondary)" },
  };
  const s = styles[color];
  return (
    <span
      className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-medium mr-1.5"
      style={{ background: s.bg, color: s.fg }}
    >
      {children}
    </span>
  );
}
