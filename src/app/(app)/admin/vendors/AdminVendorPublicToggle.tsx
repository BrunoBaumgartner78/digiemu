"use client";

import { useState } from "react";
import { isErrorResponse } from "@/lib/guards";

type Props = {
  userId: string;
  initialIsPublic: boolean;
};

export default function AdminVendorPublicToggle({ userId, initialIsPublic }: Props) {
  const [isPublic, setIsPublic] = useState(!!initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/vendors/${userId}/set-public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      if (!res.ok) {
        const data: unknown = await res.json().catch(() => ({}));
        const msg = isErrorResponse(data) ? data.message : "Toggle fehlgeschlagen";
        throw new Error(msg);
      }
      // optimistic toggle
      setIsPublic((v) => !v);
    } catch (e: any) {
      const err = e as unknown;
      setErr(err instanceof Error ? err.message : String(err ?? "Fehler"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          isPublic ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-300"
        }`}
      >
        {isPublic ? "PUBLIC" : "PRIVATE"}
      </span>
      <button className="neobtn-sm ghost" type="button" disabled={loading} onClick={toggle}>
        {loading ? "…" : "Toggle"}
      </button>
      {err ? <span className="text-xs text-rose-400">{err}</span> : null}
    </div>
  );
}
