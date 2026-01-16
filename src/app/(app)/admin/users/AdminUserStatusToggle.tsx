"use client";

import { useState } from "react";

type Props = { userId: string; isBlocked: boolean };

export default function AdminUserStatusToggle({ userId, isBlocked }: Props) {
  const [blocked, setBlocked] = useState<boolean>(!!isBlocked);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    setErr(null);

    const prev = blocked;
    const next = !prev;

    // optimistic UI update
    setBlocked(next);

    try {
      const res = await fetch("/api/admin/users/toggle-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        // rollback on error
        setBlocked(prev);
        throw new Error("Konnte Sperrstatus nicht ändern.");
      }

      // success: do not render any returned JSON; UI already updated
    } catch (e: any) {
      setErr(e?.message || "Fehler");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`neobtn-sm ${blocked ? "bg-rose-500/90 text-white" : "bg-emerald-500/90 text-white"}`}
      >
        {pending ? "Aktualisiere…" : blocked ? "Entsperren" : "Sperren"}
      </button>

      {err ? <span className="text-xs text-rose-400">{err}</span> : null}
    </div>
  );
}
