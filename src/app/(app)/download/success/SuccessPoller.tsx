"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type ApiResp =
  | { ready: true; orderId: string; status?: string }
  | { ready: false; reason?: string; status?: string; orderId?: string }
  | null;

export default function SuccessPoller({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  const [tries, setTries] = React.useState(0);
  const [msg, setMsg] = React.useState("Warte auf Bestätigung…");

  // ✅ Live realistischer
  const MAX_TRIES = 60; // ~72s bei 1200ms
  const INTERVAL_MS = 1200;

  const intervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        const url = `/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`;
        const res = await fetch(url, { method: "GET", cache: "no-store" });
        const data: ApiResp = await res.json().catch(() => null);

        if (!alive) return;

        // ✅ fertig -> weiterleiten
        if (res.ok && data && (data as any).ready && (data as any).orderId) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          router.replace(`/download/${(data as any).orderId}`);
          return;
        }

        // ✅ Status-basierte UX (wenn API status liefert)
        const status = (data as any)?.status as string | undefined;
        const reason = (data as any)?.reason as string | undefined;

        if (status === "PENDING" || reason === "NOT_PAID_YET") {
          setMsg("Zahlung noch nicht bestätigt…");
        } else if (status === "PAID" || reason === "PAID_NOT_DELIVERED_YET") {
          setMsg("Lieferung wird vorbereitet (Download-Link wird erstellt)…");
        } else {
          setMsg("Wir erstellen Bestellung & Download-Link…");
        }

        // ✅ wenn Server kurz zickt, nicht sofort abbrechen
        if (!res.ok && res.status >= 500) {
          setMsg("Server beschäftigt… bitte kurz warten…");
        }
      } catch {
        if (!alive) return;
        setMsg("Fehler beim Prüfen… bitte kurz warten…");
      } finally {
        if (!alive) return;

        setTries((t) => {
          const next = t + 1;
          if (next >= MAX_TRIES) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setMsg(
              "Zeitüberschreitung. Bitte lade die Seite neu oder prüfe deine Downloads."
            );
            return MAX_TRIES;
          }
          return next;
        });
      }
    }

    intervalRef.current = window.setInterval(tick, INTERVAL_MS);
    tick();

    return () => {
      alive = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router, sessionId]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <p className="neo-text" style={{ margin: 0 }}>
        {msg}
      </p>

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
