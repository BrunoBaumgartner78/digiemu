"use client";

import { useState } from "react";

type Props = {
  userId: string;
  isBlocked: boolean;
};

export default function AdminUserStatusToggle({ userId, isBlocked }: Props) {
  const [blocked, setBlocked] = useState<boolean>(!!isBlocked);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const res = await fetch("/api/admin/users/toggle-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Toggle fehlgeschlagen");
      }

      const data = await res.json();
      setBlocked(!!data?.user?.isBlocked);
    } catch (e) {
      console.error(e);
      alert("Konnte Sperrstatus nicht ändern. Schau Console/Serverlogs an.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`neobtn-sm ${
        blocked ? "bg-rose-500/90 text-white" : "bg-emerald-500/90 text-white"
      }`}
    >
      {pending ? "Aktualisiere…" : blocked ? "Entsperren" : "Sperren"}
    </button>
  );
}
