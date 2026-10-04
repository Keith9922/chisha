"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { greetingFor } from "@/lib/today";

export default function Greeting() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!now) {
    return (
      <div className="px-1 pb-6 pt-3">
        <h2 className="text-2xl font-light tracking-tight">&nbsp;</h2>
        <div className="text-xs mt-1.5" style={{ color: "var(--color-text-secondary)" }}>&nbsp;</div>
      </div>
    );
  }

  const g = greetingFor(now);
  const dateStr = now.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="px-1 pb-6 pt-3 flex justify-between items-start">
      <div>
        <h2 className="text-2xl font-light tracking-tight">{g}</h2>
        <div className="text-xs mt-1.5" style={{ color: "var(--color-text-secondary)" }}>{dateStr}</div>
      </div>
      <Link
        href="/settings"
        className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-70"
        style={{ color: "var(--color-text-secondary)" }}
        aria-label="设置"
      >
        <span className="text-lg">⚙</span>
      </Link>
    </div>
  );
}
