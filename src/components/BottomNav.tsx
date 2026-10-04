"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "记录", icon: "📊" },
  { href: "/chat", label: "助手", icon: "💬" },
  { href: "/history", label: "历史", icon: "📅" },
];

export default function BottomNav() {
  const pathname = usePathname();
  // 隐藏在 onboarding 上
  if (pathname.startsWith("/onboarding")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t bg-bg-card pb-[env(safe-area-inset-bottom)]"
      style={{ borderColor: "var(--color-border-soft)" }}
    >
      <div className="max-w-[480px] mx-auto flex h-20 items-start justify-around px-4 pt-3">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-1"
              style={{
                color: active ? "var(--color-accent)" : "var(--color-text-tertiary)",
              }}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] tracking-wider">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
