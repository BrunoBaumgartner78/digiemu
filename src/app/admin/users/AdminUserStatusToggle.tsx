"use client";

import { useState } from "react";

type Props = {
  userId: string;
  isBlocked: boolean;
};

export default function AdminUserStatusToggle({ userId, isBlocked }: Props) {
  const [blocked, setBlocked] = useState(isBlocked);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      // TODO: Hier später echten API-Call einbauen, z.B.:
      // await fetch("/api/admin/users/toggle-block", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ userId }),
      // });

      // Für jetzt: lokal toggeln
      setBlocked((prev) => !prev);
      console.log("Toggle user block:", userId, "→", !blocked);
    } catch (e) {
      console.error(e);
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
        blocked
          ? "bg-rose-500/90 text-white"
          : "bg-emerald-500/90 text-white"
      }`}
    >
      {pending ? "Aktualisiere…" : blocked ? "Entsperren" : "Sperren"}
    </button>
  );
}
