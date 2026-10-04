"use client";

// 全局 toast / confirm — 替换浏览器的 alert/confirm 弹窗
// 用法：
//   const toast = useToast();
//   toast.show("已记录", "success");
//   const ok = await toast.confirm("删除这一项?");
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastType = "info" | "success" | "warning" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmReq {
  message: string;
  resolve: (ok: boolean) => void;
}

interface ToastApi {
  show: (message: string, type?: ToastType, durationMs?: number) => void;
  confirm: (message: string) => Promise<boolean>;
}

const Ctx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmReq, setConfirmReq] = useState<ConfirmReq | null>(null);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const show = useCallback((message: string, type: ToastType = "info", durationMs = 2800) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
      timersRef.current.delete(id);
    }, durationMs);
    timersRef.current.set(id, timer);
  }, []);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => setConfirmReq({ message, resolve }));
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <Ctx.Provider value={{ show, confirm }}>
      {children}

      {/* Toast stack（从底部冒出） */}
      <div className="fixed bottom-24 left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} />
        ))}
      </div>

      {/* Confirm modal */}
      {confirmReq && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-6"
          style={{ background: "rgba(20, 15, 10, 0.4)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="card-lg w-full max-w-[320px] p-5"
            style={{ animation: "toast-in 0.18s ease-out" }}
          >
            <div className="text-sm leading-relaxed mb-5 text-center" style={{ color: "var(--color-text-primary)" }}>
              {confirmReq.message}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  confirmReq.resolve(false);
                  setConfirmReq(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "var(--color-bg-app)", color: "var(--color-text-secondary)" }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  confirmReq.resolve(true);
                  setConfirmReq(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "var(--color-accent)", color: "white" }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes toast-out {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-4px); }
        }
      `}</style>
    </Ctx.Provider>
  );
}

function Toast({ item }: { item: ToastItem }) {
  const styles: Record<ToastType, { bg: string; fg: string; icon: string }> = {
    info:    { bg: "var(--color-text-primary)", fg: "white", icon: "" },
    success: { bg: "var(--color-success)",       fg: "white", icon: "✓" },
    warning: { bg: "var(--color-accent)",        fg: "white", icon: "!" },
    error:   { bg: "var(--color-warning)",       fg: "white", icon: "✕" },
  };
  const s = styles[item.type];
  return (
    <div
      className="pointer-events-auto px-4 py-2.5 rounded-full text-[13px] font-medium flex items-center gap-2 max-w-[90vw]"
      style={{
        background: s.bg,
        color: s.fg,
        animation: "toast-in 0.18s ease-out",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
      }}
    >
      {s.icon && <span className="opacity-90">{s.icon}</span>}
      <span>{item.message}</span>
    </div>
  );
}
