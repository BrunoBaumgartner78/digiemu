"use client";

import { useState } from "react";
import { toErrorMessage } from "@/lib/errors";
import { useRouter } from "next/navigation";

type Props = {
  href: string;                 // API endpoint, expected to accept JSON { note: string | null }
  current?: string | null;      // current note (optional)
  className?: string;
  confirmText?: string;
  label?: string;              // preferred prop name
  /**
   * legacy alias used in some pages; mapped to `label` if provided
   */
  buttonText?: string;
  placeholder?: string;
  disabled?: boolean;
};

export default function ModerationNoteButton({
  href,
  current,
  className,
  confirmText,
  label,
  buttonText,
  placeholder = "Moderation-Notiz…",
  disabled,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(current ?? "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(next: string | null) {
    if (disabled || loading) return;
    if (confirmText && !window.confirm(confirmText)) return;

    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: next }),
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${txt ? `: ${txt}` : ""}`);
      }

      setOpen(false);
      try {
        router.refresh();
      } catch {
        window.location.reload();
      }
    } catch (e: unknown) {
      setErr(toErrorMessage(e) || "Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <button
        type="button"
        className={className}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || loading}
      >
        {loading ? "…" : buttonText ?? label ?? "Note"}
      </button>

      {open ? (
        <span
          style={{
            display: "inline-flex",
            gap: 8,
            alignItems: "center",
            padding: 8,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(10px)",
          }}
        >
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={placeholder}
            style={{
              width: 240,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
              outline: "none",
            }}
            disabled={disabled || loading}
          />

          <button type="button" onClick={() => save(note.trim() ? note.trim() : null)} disabled={disabled || loading}>
            Save
          </button>

          <button type="button" onClick={() => save(null)} disabled={disabled || loading}>
            Clear
          </button>

          <button type="button" onClick={() => setOpen(false)} disabled={disabled || loading}>
            ✕
          </button>

          {err ? <span style={{ fontSize: 12, opacity: 0.8 }}>⚠ {err}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
