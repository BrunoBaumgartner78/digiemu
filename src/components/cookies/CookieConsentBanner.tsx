"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("analytics_consent");
    if (stored === null) setVisible(true);
  }, []);

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      data-cookie-banner="1"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483647,
        background: "#232323",
        color: "white",
        padding: 16,
        display: "flex",
        gap: 12,
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>
        Wir verwenden Cookies für anonyme Statistik (Google Analytics).
      </span>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => {
            localStorage.setItem("analytics_consent", "true");
            window.gtag?.("consent", "update", {
              analytics_storage: "granted",
            });
            window.gtag?.("event", "page_view");
            setVisible(false);
          }}
          style={{
            background: "#39FF14",
            color: "#1A1A1A",
            padding: "8px 12px",
            borderRadius: 10,
            fontWeight: 600,
          }}
        >
          Erlauben
        </button>

        <button
          onClick={() => {
            localStorage.setItem("analytics_consent", "false");
            setVisible(false);
          }}
          style={{
            background: "transparent",
            border: "1px solid #39FF14",
            color: "white",
            padding: "8px 12px",
            borderRadius: 10,
          }}
        >
          Ablehnen
        </button>
      </div>
    </div>,
    document.body
  );
}
