"use client";

import React from "react";
import { useToast } from "./use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed top-4 left-1/2 z-50 flex flex-col gap-2" style={{ transform: "translateX(-50%)" }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-[280px] max-w-sm px-4 py-3 rounded shadow-lg flex items-center justify-between
            ${toast.variant === "success" ? "bg-green-600 text-white" : ""}
            ${toast.variant === "destructive" ? "bg-red-600 text-white" : ""}
            ${toast.variant === "default" || !toast.variant ? "bg-gray-900 text-white" : ""}
          `}
        >
          <div>
            <div className="font-bold">{toast.title}</div>
            {toast.description && <div className="text-sm mt-1">{toast.description}</div>}
          </div>
          <button
            className="ml-4 text-white/80 hover:text-white font-bold"
            onClick={() => dismiss(toast.id)}
            aria-label="Toast schließen"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
