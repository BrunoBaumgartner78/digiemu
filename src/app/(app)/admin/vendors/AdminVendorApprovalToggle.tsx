"use client";

import { useState } from "react";

type Props = {
  userId: string;
  initialStatus: "PENDING" | "APPROVED" | "BLOCKED" | string;
};

const OPTIONS: Array<{ v: "PENDING" | "APPROVED" | "BLOCKED"; label: string }> = [
  { v: "PENDING", label: "PENDING" },
  { v: "APPROVED", label: "APPROVED" },
  { v: "BLOCKED", label: "BLOCKED" },
];

export default function AdminVendorApprovalToggle({ userId, initialStatus }: Props) {
  const [status, setStatus] = useState<string>((initialStatus || "PENDING").toString().toUpperCase());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function update(next: "PENDING" | "APPROVED" | "BLOCKED") {
    if (loading) return;
    setLoading(true);
    setErr(null);

    const prev = status;
    const nextUpper = next.toString().toUpperCase();

    // optimistic update
    setStatus(nextUpper);

    try {
      const res = await fetch(`/api/admin/vendors/${userId}/vendorprofile/set-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextUpper }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.ok === false) {
        setStatus(prev); // rollback
        throw new Error("Update fehlgeschlagen.");
      }

      // Optional: server is source of truth
      if (data?.status) setStatus(String(data.status).toUpperCase());
    } catch (e: any) {
      setErr(e?.message || "Konnte Status nicht ändern.");
      setStatus(prev);
    } finally {
      setLoading(false);
    }
  }

  const s = String(status).toUpperCase();
  const badge =
    s === "APPROVED"
      ? "bg-emerald-500/10 text-emerald-400"
      : s === "BLOCKED"
      ? "bg-rose-500/10 text-rose-400"
      : "bg-slate-500/10 text-slate-300";

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge}`}>{s}</span>

      <select
        className="input-neu text-xs h-9"
        value={s}
        onChange={(_e) => update(_e.target.value as any)}
        disabled={loading}
        title="Vendor Freischaltung"
      >
        {OPTIONS.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>

      {loading ? <span className="text-xs text-[var(--text-muted)]">…</span> : null}
      {err ? <span className="text-xs text-rose-400">{err}</span> : null}
    </div>
  );
}
