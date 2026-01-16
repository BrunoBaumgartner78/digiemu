"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function SuccessPoller({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [tries, setTries] = React.useState(0);
  const [msg, setMsg] = React.useState("Warte auf Bestätigung...");
  const MAX_TRIES = 8; // ~9.6s with INTERVAL_MS
  const INTERVAL_MS = 1200;
  const intervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        const res = await fetch(`/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`, {
          method: "GET",
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);

        if (!alive) return;

        if (res.ok && data?.ready && data?.orderId) {
          // stop polling and navigate
          if (intervalRef.current) {
            clearInterval(intervalRef.current as unknown as number);
            intervalRef.current = null;
          }
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
        setTries((t) => {
          const next = t + 1;
          if (next >= MAX_TRIES) {
            // stop polling
            if (intervalRef.current) {
              clearInterval(intervalRef.current as unknown as number);
              intervalRef.current = null;
            }
            setMsg("Zeitüberschreitung beim Warten. Bitte lade die Seite neu oder prüfe deine Bestellungen.");
            return Math.min(next, MAX_TRIES);
          }
          return next;
        });
      }

    }

    intervalRef.current = window.setInterval(tick, INTERVAL_MS) as unknown as number;
    tick();

    return () => {
      alive = false;
      if (intervalRef.current) clearInterval(intervalRef.current as unknown as number);
    };
  }, [router, sessionId]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <p className="neo-text" style={{ margin: 0 }}>{msg}</p>

      <p className="neo-text opacity-70" style={{ margin: 0, fontSize: 13 }}>
        Warte auf Bestätigung ({tries}/{MAX_TRIES})
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
