"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "analytics_consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === null) {
      setVisible(true); // ✅ DAS HAT GEFEHLT
    }
  }, []);

  if (!visible) return null;

  const onAllow = () => {
    localStorage.setItem(STORAGE_KEY, "true");

    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
    });

    window.gtag?.("event", "page_view"); // Initiales Signal

    setVisible(false);
  };

  const onDeny = () => {
    localStorage.setItem(STORAGE_KEY, "false");
    setVisible(false);
  };

  return (
    <div
      data-cookie-banner="1"
      className="fixed bottom-0 left-0 w-full z-[999999]
                 bg-[#111] text-white p-4
                 flex flex-col md:flex-row
                 items-center justify-between gap-3
                 shadow-2xl"
    >
      <span className="text-sm opacity-90">
        Wir verwenden Cookies für anonyme Statistik (Google Analytics).
      </span>

      <div className="flex gap-2">
        <button
          onClick={onAllow}
          className="px-4 py-2 rounded-xl
                     bg-green-400 text-black font-semibold"
        >
          Erlauben
        </button>

        <button
          onClick={onDeny}
          className="px-4 py-2 rounded-xl
                     border border-white/30 text-white"
        >
          Ablehnen
        </button>
      </div>
    </div>
  );
}
