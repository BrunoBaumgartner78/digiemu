"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Props = {
  userId: string;
  isBlocked: boolean;
  currentUserId: string;
  targetRole?: string; // "ADMIN" | "VENDOR" | "BUYER"
};

export default function AdminUserStatusToggle({
  userId,
  isBlocked,
  currentUserId,
  targetRole,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
  }, [isBlocked]);

  // UI guard (server already enforces it too)
  const disabled = pending || userId === currentUserId || targetRole === "ADMIN";

  const label = useMemo(() => {
    if (userId === currentUserId) return "Du selbst";
    if (targetRole === "ADMIN") return "Admin geschützt";
    return isBlocked ? "Entsperren" : "Sperren";
  }, [userId, currentUserId, targetRole, isBlocked]);

  async function toggle() {
    if (disabled) return;

    setPending(true);
    setErr(null);

    try {
      const res = await fetch("/api/admin/users/toggle-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Toggle failed");
      }

      router.refresh();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Fehler");
      alert("Konnte User-Status nicht ändern. Schau Console/Serverlogs an.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`neobtn-sm ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : isBlocked
            ? "bg-emerald-600/90 text-white"
            : "bg-rose-600/90 text-white"
        }`}
        title={
          userId === currentUserId
            ? "Du kannst dich nicht selbst sperren"
            : targetRole === "ADMIN"
            ? "Admin-Accounts dürfen nicht gesperrt werden"
            : ""
        }
      >
        {pending ? "…" : label}
      </button>

      {err ? (
        <span style={{ fontSize: 11, opacity: 0.7, maxWidth: 240, lineHeight: 1.2 }}>{err}</span>
      ) : null}
    </div>
  );
}
