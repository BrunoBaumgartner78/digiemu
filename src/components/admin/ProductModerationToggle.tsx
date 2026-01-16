"use client";

import { useState } from "react";
import { getErrorMessage, isRecord, isString } from "../../lib/guards";

export default function ProductModerationToggle({
  productId,
  currentStatus,
  currentNote,
  onUpdated,
}: {
  productId: string;
  currentStatus: "DRAFT" | "ACTIVE" | "BLOCKED";
  currentNote: string | null;
  onUpdated?: () => void;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState(currentNote ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleStatus = () => {
    const next: "ACTIVE" | "BLOCKED" = status === "BLOCKED" ? "ACTIVE" : "BLOCKED";

    setStatus(next);
    save(next, note);
  };

  const save = async (newStatus: "DRAFT" | "ACTIVE" | "BLOCKED", newNote: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          moderationNote: newNote || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as unknown;
        if (isRecord(data) && isString((data as Record<string, unknown>).error)) {
          setError((data as Record<string, unknown>).error as string);
        } else {
          setError("Update failed");
        }
        return;
      }

      if (onUpdated) onUpdated();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-[var(--card-bg)] p-4 border border-[var(--neo-card-border)] shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${
            status === "BLOCKED"
              ? "bg-red-600 text-white"
              : status === "DRAFT"
              ? "bg-gray-400 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          {status}
        </span>

        <button
          onClick={toggleStatus}
          disabled={loading}
          className="neobtn-sm primary"
        >
          {loading
            ? "Speichere…"
            : status === "BLOCKED"
            ? "Entsperren"
            : "Blockieren"}
        </button>
      </div>

      <label className="block text-xs text-[var(--text-muted)] mb-1">
        Moderationsnotiz
      </label>
      <textarea
        className="input-neu w-full"
        rows={3}
        value={note}
        onChange={(_e) => setNote(_e.target.value)}
        placeholder="Grund für Blockierung…"
      />

      <div className="mt-2 flex justify-end">
        <button
          onClick={() => save(status, note)}
          className="neobtn-sm"
          disabled={loading}
        >
          {loading ? "…" : "Notiz speichern"}
        </button>
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-500">{error}</div>
      )}
    </div>
  );
}
