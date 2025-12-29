"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const STORAGE_KEY = "analytics_consent";
const EVENTS_ON_GRANT = ["page_view"] as const;

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Nur anzeigen, wenn noch keine Entscheidung getroffen wurde
      setVisible(stored === null);
    } catch {
      // Falls localStorage geblockt ist: trotzdem anzeigen
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const onAllow = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}

    // Consent updaten (GA darf nun messen)
    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
    });

    // Nach Consent ein page_view auslösen (sonst bleibt Realtime oft 0)
    for (const ev of EVENTS_ON_GRANT) {
      window.gtag?.("event", ev);
    }

    setVisible(false);
  };

  const onDeny = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "false");
    } catch {}

    // Optional: explizit denied setzen
    window.gtag?.("consent", "update", {
      analytics_storage: "denied",
    });

    setVisible(false);
  };

  return (
    <div
      data-cookie-banner="1"
      className="fixed bottom-0 left-0 w-full z-[2147483647] bg-[#232323] text-white p-4 flex flex-col md:flex-row items-center justify-between shadow"
    >
      <span className="mb-2 md:mb-0">
        Wir verwenden Cookies für anonyme Statistik (Google Analytics).
      </span>

      <div className="flex gap-2">
        <button
          className="px-4 py-2 rounded bg-[#39FF14] text-[#1A1A1A] font-semibold"
          onClick={onAllow}
        >
          Erlauben
        </button>

        <button
          className="px-4 py-2 rounded border border-[#39FF14] text-white font-semibold"
          onClick={onDeny}
        >
          Ablehnen
        </button>
      </div>
    </div>
  );
}
