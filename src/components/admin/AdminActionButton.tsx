"use client";

import { useState } from "react";
import { toErrorMessage } from "@/lib/errors";
import { useRouter } from "next/navigation";

type Props = {
  href: string;
  body?: unknown;
  className?: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  children: React.ReactNode;

  confirmText?: string | null;
  // allow null to explicitly disable confirmation text in callers
  // (some callers pass null)
  disabled?: boolean;

  /** default: true */
  refreshAfter?: boolean;

  /** optional: show inline error (default true) */
  showError?: boolean;
};

export default function AdminActionButton({
  href,
  body,
  className,
  method = "POST",
  children,
  confirmText,
  disabled,
  refreshAfter = true,
  showError = true,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    if (disabled || loading) return;
    if (confirmText && !window.confirm(confirmText)) return;

    setErr(null);
    setLoading(true);

    try {
      const res = await fetch(href, {
        method,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        // JSON error fallback
        let msg = txt;
        try {
          const j = JSON.parse(txt);
          msg = j?.message ?? j?.error ?? txt;
        } catch {}
        throw new Error(`HTTP ${res.status}${msg ? `: ${msg}` : ""}`);
      }

      if (refreshAfter) {
        // App Router refresh
        try {
          router.refresh();
        } catch {
          window.location.reload();
        }
      }
    } catch (e: unknown) {
      const msg = toErrorMessage(e) || "Fehler";
      if (showError) setErr(msg);
      else alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      <button
        type="button"
        className={className}
        onClick={run}
        disabled={disabled || loading}
        aria-busy={loading ? "true" : "false"}
      >
        {loading ? "…" : children}
      </button>

      {showError && err ? <span style={{ fontSize: 12, opacity: 0.75 }}>⚠ {err}</span> : null}
    </span>
  );
}
