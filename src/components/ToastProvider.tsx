"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type ToastKind = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

// Lives in the root layout so a toast fired right before a router.push survives
// the client-side navigation and is still visible on the page you land on. The
// toast is portaled to <body> and explicitly fixed to the viewport so a
// transformed ancestor (e.g. the page's fade-in animation) can't pin it into
// the page flow.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const nextId = useRef(0);

  // Mount gate so the body portal only renders client-side (document exists).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev, { id, message, kind }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: "max(1rem, env(safe-area-inset-bottom))",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
              pointerEvents: "none",
              padding: "0 1rem",
            }}
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`alert ${
                  t.kind === "success" ? "alert-success" : "alert-error"
                } shadow-lg text-sm w-auto max-w-[90vw]`}
                style={{ pointerEvents: "auto" }}
              >
                <span>{t.message}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
