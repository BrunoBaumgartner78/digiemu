"use client";

import { useState } from "react";

type Props = {
  userId: string;
  initialStatus: "PENDING" | "APPROVED" | "BLOCKED" | string;
};

function badge(status: string) {
  if (status === "APPROVED") return "bg-emerald-500/10 text-emerald-400";
  if (status === "PENDING") return "bg-amber-500/10 text-amber-400";
  if (status === "BLOCKED") return "bg-rose-500/10 text-rose-500";
  return "bg-slate-500/10 text-slate-300";
}

export default function AdminVendorStatusToggle({ userId, initialStatus }: Props) {
  const [status, setStatus] = useState(String(initialStatus || "PENDING").toUpperCase());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function setNext(next: "PENDING" | "APPROVED" | "BLOCKED") {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/vendors/${userId}/set-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Update fehlgeschlagen");
      }
      setStatus(String(next).toUpperCase());
    } catch (e: any) {
      setErr(e?.message || "Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge(status)}`}>{status}</span>
      <button className="neobtn-sm ghost" disabled={loading} onClick={() => setNext("PENDING")} type="button">
        Pending
      </button>
      <button className="neobtn-sm" disabled={loading} onClick={() => setNext("APPROVED")} type="button">
        Approve
      </button>
      <button className="neobtn-sm ghost" disabled={loading} onClick={() => setNext("BLOCKED")} type="button">
        Block
      </button>
      {err ? <span className="text-xs text-rose-400">{err}</span> : null}
    </div>
  );
}
