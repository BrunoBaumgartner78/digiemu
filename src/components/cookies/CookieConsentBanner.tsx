"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const STORAGE_KEY = "analytics_consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) setVisible(true);

    if (stored === "true") {
      initGA();
    }
  }, []);

  const initGA = () => {
    if (!GA_ID || !window.gtag) return;

    window.gtag("consent", "update", {
      analytics_storage: "granted",
    });

    window.gtag("config", GA_ID, {
      debug_mode: true, // 🔥 DAMIT DebugView LEBT
      send_page_view: true,
    });
  };

  const allow = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    initGA();
    setVisible(false);
  };

  const deny = () => {
    localStorage.setItem(STORAGE_KEY, "false");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      data-cookie-banner="1"
      className="fixed bottom-4 left-4 right-4 z-[999999]
                 rounded-2xl p-4 bg-white/70 backdrop-blur
                 shadow-xl flex justify-between items-center gap-4"
    >
      <span className="text-sm text-black/80">
        Wir verwenden Cookies für anonyme Statistik (Google Analytics).
      </span>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 rounded-xl bg-black text-white"
          onClick={allow}
        >
          Erlauben
        </button>
        <button
          className="px-4 py-2 rounded-xl border"
          onClick={deny}
        >
          Ablehnen
        </button>
      </div>
    </div>
  );
}
