"use client";

import { useEffect, useState } from "react";
import styles from "./CookieConsentBanner.module.css";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const key = "analytics_consent";

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored === null) setVisible(true);
  }, []);

  if (!visible) return null;

  const onAllow = () => {
    localStorage.setItem(key, "true");
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
    window.gtag?.("event", "page_view"); // optional
    setVisible(false);
  };

  const onDeny = () => {
    localStorage.setItem(key, "false");
    setVisible(false);
  };

  return (
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

        <p className={styles.hint}>
          Du kannst deine Entscheidung jederzeit im Browser löschen (localStorage).
        </p>
      </div>
    </div>
  );
}
