"use client";

import { useEffect, useState } from "react";
import { analyticsConfig } from "@/lib/analytics/config";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = analyticsConfig.consent.storageKey;
    const stored = localStorage.getItem(key);
    if (stored === null) setVisible(true);
  }, []);

  if (!visible) return null;

  const onAllow = () => {
    const key = analyticsConfig.consent.storageKey;

    localStorage.setItem(key, "true");

    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
    });

    // ✅ YAML-gesteuert: events.onGrant
    for (const ev of analyticsConfig.events.onGrant) {
      window.gtag?.("event", ev);
    }

    setVisible(false);
  };

  const onDeny = () => {
    const key = analyticsConfig.consent.storageKey;
    localStorage.setItem(key, "false");
    setVisible(false);
  };

  return (
    <div
      data-cookie-banner="1"
      className="fixed bottom-0 left-0 w-full z-[999999] bg-[#232323] text-white p-4 flex flex-col md:flex-row items-center justify-between shadow"
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
