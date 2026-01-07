"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  userId: string;
  isBlocked: boolean;
};

export default function AdminUserStatusToggle({ userId, isBlocked }: Props) {
  const router = useRouter();

  // ✅ local state
  const [blocked, setBlocked] = useState(isBlocked);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ IMPORTANT: sync when server props change (after refresh)
  useEffect(() => {
    setBlocked(isBlocked);
  }, [isBlocked]);

  async function toggle() {
    setErr(null);
    const next = !blocked;

    // optimistic
    setBlocked(next);
    setPending(true);

    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: next }),
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Request failed (${res.status})`);
      }

      // ✅ ensure server data is used
      router.refresh();
    } catch (e: any) {
      // rollback
      setBlocked(!next);
      setErr(e?.message ?? "Unbekannter Fehler");
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="neobtn-sm"
        style={{
          opacity: pending ? 0.7 : 1,
          cursor: pending ? "not-allowed" : "pointer",
          border: "1px solid rgba(0,0,0,0.15)",
        }}
      >
        {blocked ? "Entsperren" : "Sperren"}
      </button>

      {err && (
        <span style={{ fontSize: 12, color: "crimson", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>
          {err}
        </span>
      )}
    </div>
  );
}
