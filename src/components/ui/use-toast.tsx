// src/components/ui/use-toast.ts
"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type ToastVariant = "default" | "success" | "destructive";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastInput = Omit<Toast, "id">;

type ToastContextType = {
  toasts: Toast[];
  toast: (t: ToastInput) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function toast(t: ToastInput) {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => dismiss(id), 4000);
  }

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed top-4 right-4 space-y-4 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white ${
              t.variant === "destructive"
                ? "bg-red-600"
                : t.variant === "success"
                ? "bg-green-600"
                : "bg-gray-800"
            }`}
          >
            <strong>{t.title}</strong>
            {t.description && <div className="text-sm opacity-80">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
