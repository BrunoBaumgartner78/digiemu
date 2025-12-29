"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./CookieConsentBanner.module.css";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const key = "analytics_consent";

  useEffect(() => {
    setMounted(true);

    try {
      const stored = localStorage.getItem(key);
      // Nur zeigen, wenn noch nie entschieden wurde
      setVisible(stored === null);
    } catch {
      // Falls localStorage geblockt ist: trotzdem zeigen
      setVisible(true);
    }
  }, []);

  if (!mounted || !visible) return null;

  const onAllow = () => {
    localStorage.setItem(key, "true");
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
    setVisible(false);
  };

  const onDeny = () => {
    localStorage.setItem(key, "false");
    setVisible(false);
  };

  return createPortal(
    <div className={styles.overlay} data-cookie-banner="1">
      <div className={styles.panel}>
        <div className={styles.title}>Cookies & Statistik</div>
        <p className={styles.text}>
          Wir verwenden Cookies für anonyme Statistik (Google Analytics).
        </p>

        <div className={styles.actions}>
          <button className={styles.secondary} onClick={onDeny}>
            Ablehnen
          </button>
          <button className={styles.primary} onClick={onAllow}>
            Erlauben
          </button>
        </div>

        <p className={styles.hint}>Du kannst die Entscheidung jederzeit im Browser löschen.</p>
      </div>
    </div>,
    document.body
  );
}
