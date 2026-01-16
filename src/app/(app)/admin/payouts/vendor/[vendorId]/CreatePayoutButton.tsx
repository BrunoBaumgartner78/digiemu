"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isErrorResponse } from "@/lib/guards";

export default function MarkPaidButton(props: { payoutId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onClick() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payouts/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId: props.payoutId }),
      });

      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = isErrorResponse(data) ? data.message : "Update fehlgeschlagen.";
        throw new Error(msg);
      }

      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) setErr(error.message);
      else setErr(String(error) || "Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        className="neobtn-sm primary"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? "…" : "Als bezahlt markieren"}
      </button>
      {err && <div className="mt-1 text-[11px] text-rose-300">{err}</div>}
    </div>
  );
}
