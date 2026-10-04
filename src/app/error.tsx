"use client";

import Link from "next/link";

// 全局错误兜底页面 — 比 500 友好
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 检测是不是 DB 未配置导致的错误
  const isDbError = /TURSO_DATABASE_URL|DATABASE_URL|libsql|connection|Cannot/i.test(error.message);

  return (
    <div className="px-6 pt-12 pb-10 max-w-md mx-auto">
      {isDbError ? (
        <>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🛠</div>
            <h1 className="text-xl font-medium mb-1">还差一步</h1>
            <div className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              数据库还没配好
            </div>
          </div>
          <div className="card p-5 text-[13px] leading-relaxed mb-4">
            <p className="mb-3">应用已部署但数据库连接失败。如果你是部署者，请：</p>
            <Link
              href="/setup"
              className="inline-block btn-primary"
              style={{ textDecoration: "none" }}
            >
              查看部署步骤 →
            </Link>
          </div>
          <details className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
            <summary>技术细节</summary>
            <pre className="mt-2 p-2 bg-black/5 rounded overflow-x-auto">{error.message}</pre>
          </details>
        </>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🤔</div>
            <h1 className="text-xl font-medium mb-1">出了点问题</h1>
            <div className="text-xs mb-4" style={{ color: "var(--color-text-tertiary)" }}>
              可以试着刷新一下
            </div>
          </div>
          <button onClick={reset} className="btn-primary w-full">
            重试
          </button>
          <details className="mt-4 text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
            <summary>技术细节</summary>
            <pre className="mt-2 p-2 bg-black/5 rounded overflow-x-auto">{error.message}</pre>
          </details>
        </>
      )}
    </div>
  );
}
