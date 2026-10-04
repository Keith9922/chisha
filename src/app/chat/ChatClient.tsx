"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { TodayStatus } from "@/lib/today-status";
import { useToast } from "@/components/Toast";

export interface ChatMsg {
  id: number | string;
  role: "user" | "assistant" | "tool";
  content: string;
  roast?: boolean;
}

export default function ChatClient({
  initialStatus,
  initialMessages,
  aiConfigured = true,
}: {
  initialStatus: TodayStatus;
  initialMessages: ChatMsg[];
  aiConfigured?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const userMsg: ChatMsg = { id: `u${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setSending(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "请求失败");

      const replies: ChatMsg[] = (j.assistant_messages ?? []).map((c: string, i: number) => ({
        id: `a${Date.now()}_${i}`,
        role: "assistant" as const,
        content: c,
        roast: detectRoast(c),
      }));
      setMessages((m) => [...m, ...replies]);
      if (j.status) setStatus(j.status);
      router.refresh(); // 让 record 页同步刷新数据
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "出错了";
      setMessages((m) => [
        ...m,
        { id: `e${Date.now()}`, role: "assistant", content: `[出错] ${errMsg}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function clearChat() {
    if (!(await toast.confirm("清空对话历史？"))) return;
    await fetch("/api/chat", { method: "DELETE" });
    setMessages([]);
    toast.show("对话已清空", "info");
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] px-5">
      <div className="pt-3 pb-3 border-b" style={{ borderColor: "var(--color-border-soft)" }}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">问问 AI</h2>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              清空
            </button>
          )}
        </div>
        <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          <span>
            <span className="num font-medium" style={{ color: "var(--color-accent)" }}>
              {status.remaining_kcal >= 0 ? status.remaining_kcal : `超 ${-status.remaining_kcal}`}
            </span> kcal {status.remaining_kcal >= 0 ? "剩余" : ""}
          </span>
          <span>
            距睡 <span className="num font-medium" style={{ color: "var(--color-accent)" }}>{status.time_until_bedtime}</span>
          </span>
          {status.exercise_kcal > 0 && (
            <span>
              运动 <span className="num font-medium" style={{ color: "var(--color-success)" }}>−{status.exercise_kcal}</span>
            </span>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-3.5">
        {!aiConfigured && messages.length === 0 && (
          <div
            className="card p-4 text-[13px] leading-relaxed"
            style={{ background: "var(--color-warning-soft)", color: "var(--color-warning)" }}
          >
            <div className="font-medium mb-1">⚠️ AI 服务未配置</div>
            <div>
              本应用部署者需要在环境变量中设置{" "}
              <code className="text-[11px] px-1 py-0.5 rounded bg-white/40">MINIMAX_API_KEY</code>。
              <br />
              在此期间你仍然可以正常用<strong>记录页</strong>加食物——数据库匹配的食物不需要 AI。
            </div>
          </div>
        )}
        {aiConfigured && messages.length === 0 && (
          <div className="text-center mt-12 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            <div className="text-2xl mb-3">👋</div>
            告诉我吃了啥、想吃啥、或刚做了什么运动
            <div className="mt-4 px-6 text-[11px] leading-relaxed">
              试试： &quot;一份西红柿炒蛋盖饭&quot; · &quot;刚跑了 5 公里&quot; · &quot;还能吃个奶茶吗&quot;
            </div>
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
        {sending && (
          <div className="flex items-start">
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-md text-sm"
              style={{ background: "var(--color-bg-card)", color: "var(--color-text-tertiary)" }}
            >
              思考中...
            </div>
          </div>
        )}
      </div>

      <div className="pb-4 pt-2">
        <div
          className="card border flex items-center gap-2 px-4 py-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="对 AI 说点啥..."
            className="flex-1 bg-transparent outline-none text-sm"
            disabled={sending}
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="text-sm font-medium disabled:opacity-30"
            style={{ color: "var(--color-accent)" }}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMsg }) {
  if (msg.role === "tool") return null;
  const isUser = msg.role === "user";
  const roast = msg.roast;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed"
        style={{
          background: isUser
            ? "var(--color-accent)"
            : roast
              ? "var(--color-warning-soft)"
              : "var(--color-bg-card)",
          color: isUser
            ? "white"
            : roast
              ? "var(--color-warning)"
              : "var(--color-text-primary)",
          borderRadius: 18,
          borderBottomLeftRadius: !isUser ? 6 : 18,
          borderBottomRightRadius: isUser ? 6 : 18,
          borderLeft: roast ? "3px solid var(--color-warning)" : undefined,
          boxShadow: !isUser && !roast ? "var(--shadow-card-sm)" : undefined,
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

function detectRoast(text: string): boolean {
  return /超|超标|凌晨|不拦你|预算用完|劝你/.test(text);
}
