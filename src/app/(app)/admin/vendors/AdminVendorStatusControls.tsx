"use client";

import { useState } from "react";

type Props = {
  userId: string;
  initialIsPublic: boolean | null;
  initialStatus: string | null;
};

function Badge({ children }: { children: any }) {
  return (
    <span
      className="px-2 py-1 rounded-full text-[11px] font-semibold bg-[rgba(148,163,184,0.12)] border border-[var(--neo-card-border)]"
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      {children}
    </span>
  );
}

export default function AdminVendorStatusControls({ userId, initialIsPublic, initialStatus }: Props) {
  const [isPublic, setIsPublic] = useState<boolean>(!!initialIsPublic);
  const [status, setStatus] = useState<string>((initialStatus ?? "PENDING").toUpperCase());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function setVendorStatus(next: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/vendors/${userId}/set-vendor-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Fehler beim Setzen des Status.");
      }
      setStatus(String(next).toUpperCase());
      setMsg("Status gespeichert.");
    } catch (e: any) {
      setMsg(e?.message || "Fehler.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublic() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/vendors/${userId}/toggle-public`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Fehler beim Toggle.");
      }
      setIsPublic((v) => !v);
      setMsg("Public-Status gespeichert.");
    } catch (e: any) {
      setMsg(e?.message || "Fehler.");
    } finally {
      setBusy(false);
    }
  }

  const statusColor =
    status === "APPROVED"
      ? "bg-emerald-500/10 text-emerald-400"
      : status === "BLOCKED"
      ? "bg-rose-500/10 text-rose-400"
      : "bg-slate-500/10 text-slate-200";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 items-center">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{status}</span>

        <Badge>
          Profil: <span className={isPublic ? "text-emerald-400" : "text-slate-200"}>{isPublic ? "PUBLIC" : "PRIVATE"}</span>
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="neobtn-sm" disabled={busy} onClick={() => setVendorStatus("APPROVED")} type="button">
          Approve
        </button>
        <button className="neobtn-sm ghost" disabled={busy} onClick={() => setVendorStatus("PENDING")} type="button">
          Pending
        </button>
        <button className="neobtn-sm ghost" disabled={busy} onClick={() => setVendorStatus("BLOCKED")} type="button">
          Block
        </button>

        <button className="neobtn-sm ghost" disabled={busy} onClick={togglePublic} type="button">
          {isPublic ? "Make Private" : "Make Public"}
        </button>
      </div>

      {msg ? <div className="text-[11px] text-[var(--text-muted)]">{msg}</div> : null}
    </div>
  );
}
