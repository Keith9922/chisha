"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function LoginClient({ nextUrl }: { nextUrl: string }) {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json();
    if (r.ok) {
      toast.show("登录成功", "success");
      router.push(nextUrl);
      router.refresh();
    } else {
      setSubmitting(false);
      toast.show(j.error ?? "登录失败", "error");
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col px-6 pt-16 pb-8 max-w-md mx-auto">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🍊</div>
        <h1 className="text-2xl font-light tracking-tight">欢迎回来</h1>
        <div className="text-xs mt-1.5" style={{ color: "var(--color-text-secondary)" }}>
          登录吃啥账号
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <Field label="邮箱">
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent outline-none text-base"
            placeholder="you@example.com"
          />
        </Field>

        <Field label="密码">
          <input
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent outline-none text-base"
            placeholder="至少 8 位"
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full mt-6 disabled:opacity-50"
        >
          {submitting ? "登录中..." : "登录"}
        </button>
      </form>

      <div className="text-center mt-8 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
        还没账号？{" "}
        <Link href="/register" style={{ color: "var(--color-accent)" }}>
          立即注册
        </Link>
      </div>

      <div className="mt-auto text-center text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
        <Link href="/about">关于吃啥</Link>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] mb-1.5 tracking-wider uppercase" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}
