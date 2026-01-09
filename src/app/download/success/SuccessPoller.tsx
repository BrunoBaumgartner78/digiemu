"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function SuccessPoller({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [tries, setTries] = React.useState(0);
  const [msg, setMsg] = React.useState("Warte auf Bestätigung...");

  React.useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        const res = await fetch(
          `/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`,
          { method: "GET", cache: "no-store" }
        );
        const data = await res.json().catch(() => null);

        if (!alive) return;

        if (res.ok && data?.ready && data?.orderId) {
          router.replace(`/download/${data.orderId}`);
          return;
        }

        setMsg(
          data?.reason === "NOT_PAID_YET"
            ? "Zahlung noch nicht bestätigt..."
            : "Wir erstellen Bestellung & Download-Link..."
        );
      } catch {
        if (!alive) return;
        setMsg("Fehler beim Prüfen. Bitte kurz warten...");
      } finally {
        if (!alive) return;
        setTries((t) => t + 1);
      }
    }

    const interval = setInterval(tick, 1500);
    tick();

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [router, sessionId]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <p className="neo-text" style={{ margin: 0 }}>{msg}</p>

      <p className="neo-text opacity-70" style={{ margin: 0, fontSize: 13 }}>
        Warte auf Bestätigung ({tries}/60)
      </p>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="neobtn ghost" onClick={() => window.location.reload()}>
          Neu laden
        </button>
        <button className="neobtn" onClick={() => router.push("/account/downloads")}>
          Zu meinen Downloads
        </button>
      </div>
    </div>
  );
}
