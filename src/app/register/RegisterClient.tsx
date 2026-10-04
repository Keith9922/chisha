"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function RegisterClient() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const j = await r.json();
    if (r.ok) {
      toast.show("注册成功，欢迎！", "success");
      // 直接进 onboarding（页面 guard 会判断）
      router.push("/onboarding");
      router.refresh();
    } else {
      setSubmitting(false);
      toast.show(j.error ?? "注册失败", "error");
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col px-6 pt-16 pb-8 max-w-md mx-auto">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🍊</div>
        <h1 className="text-2xl font-light tracking-tight">注册吃啥</h1>
        <div className="text-xs mt-1.5" style={{ color: "var(--color-text-secondary)" }}>
          1 分钟开始管理你的饮食
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent outline-none text-base"
            placeholder="至少 8 位"
          />
        </Field>

        <Field label="昵称（可选）">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="w-full bg-transparent outline-none text-base"
            placeholder="留空也行"
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full mt-6 disabled:opacity-50"
        >
          {submitting ? "注册中..." : "注册"}
        </button>
      </form>

      <div className="text-center mt-8 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
        已有账号？{" "}
        <Link href="/login" style={{ color: "var(--color-accent)" }}>
          直接登录
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
