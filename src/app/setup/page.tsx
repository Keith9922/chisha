// 当 Turso DB 还没配好时，pages 会 throw — 这是给部署者看的引导页
// 直接访问 /setup 永远显示部署说明
export const metadata = { title: "部署设置 · 吃啥" };

export default function SetupPage() {
  return (
    <div className="px-5 pb-10 pt-3">
      <div className="text-center mb-8 pt-6">
        <div className="text-5xl mb-3">🍊</div>
        <h1 className="text-2xl font-light mb-1">还差一步</h1>
        <div className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          需要配置云端数据库才能开始用
        </div>
      </div>

      <div
        className="card p-4 mb-5 text-[13px] leading-relaxed"
        style={{ background: "var(--color-warning-soft)", color: "var(--color-warning)" }}
      >
        <div className="font-medium mb-1">⚠️ 数据库未配置</div>
        <div>
          本应用部署在 Vercel 上，需要一个云端 SQLite 数据库（推荐 <a href="https://turso.tech" className="underline">Turso</a>，免费）。
          作为部署者，按下面 4 步把数据库接上即可。
        </div>
      </div>

      <Step n="1" title="装 Turso CLI">
        <Code>{`brew install tursodatabase/tap/turso
# 或:
curl -sSfL https://get.tur.so/install.sh | bash`}</Code>
      </Step>

      <Step n="2" title="登录 + 建库">
        <Code>{`turso auth signup
turso db create chisha
turso db show chisha --url       # 拿 URL
turso db tokens create chisha    # 拿 token`}</Code>
      </Step>

      <Step n="3" title="把 schema 推到云端 + 配 Vercel env">
        <Code>{`# 推 schema
TURSO_DATABASE_URL="libsql://..." \\
TURSO_AUTH_TOKEN="eyJ..." \\
npx prisma migrate deploy

# 加到 Vercel
vercel env add TURSO_DATABASE_URL production
vercel env add TURSO_AUTH_TOKEN production`}</Code>
      </Step>

      <Step n="4" title="重新部署">
        <Code>{`vercel --prod`}</Code>
      </Step>

      <div className="mt-6 text-center text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
        全部完成后刷新即可开始用
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="num text-sm w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: "var(--color-accent)", color: "white" }}
        >
          {n}
        </span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="ml-8">{children}</div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre
      className="text-[11px] p-3 rounded-lg overflow-x-auto leading-relaxed"
      style={{
        background: "var(--color-text-primary)",
        color: "#FAF7F2",
        fontFamily: "ui-monospace, 'SF Mono', monospace",
      }}
    >
      {children}
    </pre>
  );
}
