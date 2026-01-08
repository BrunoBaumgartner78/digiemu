"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Props = {
  userId: string;
  isBlocked: boolean;
  targetRole?: "ADMIN" | "VENDOR" | "BUYER" | string;
  currentUserId?: string | null; // ✅ neu
};

export default function AdminUserStatusToggle({
  userId,
  isBlocked,
  targetRole,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { label } = useMemo(() => {
    return { label: isBlocked ? "Entsperren" : "Sperren" };
  }, [isBlocked]);

  // ✅ HARD UI guard: cannot block self or ADMIN users
  const disabled =
    pending ||
    (currentUserId ? userId === currentUserId : false) ||
    targetRole === "ADMIN";

  async function toggle() {
    setErr(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/users/toggle-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Request failed: ${res.status}`);
      }

      router.refresh();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Konnte Status nicht ändern");
      alert("Konnte Status nicht ändern. Schau Console/Serverlogs an.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`neobtn-sm ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : isBlocked
            ? "bg-emerald-500/90 text-white"
            : "bg-rose-500/90 text-white"
        }`}
        title={
          targetRole === "ADMIN"
            ? "ADMIN Nutzer können nicht gesperrt werden"
            : currentUserId && userId === currentUserId
            ? "Du kannst dich nicht selbst sperren"
            : ""
        }
      >
        {pending ? "…" : label}
      </button>

      {err ? <span className="text-xs text-rose-500">{err}</span> : null}
    </div>
  );
}
