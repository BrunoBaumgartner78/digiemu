"use client";

import { useEffect, useState } from "react";
import styles from "./CookieConsentBanner.module.css";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const STORAGE_KEY = "analytics_consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === null) setVisible(true);
    } catch {
      // wenn localStorage blockiert ist: Banner trotzdem zeigen
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const allow = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}

    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
    });

    // optional: einmal page_view nach Consent
    window.gtag?.("event", "page_view");

    setVisible(false);
  };

  const deny = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "false");
    } catch {}
    setVisible(false);
  };

  return (
    <div data-cookie-banner="1" className={styles.bar}>
      <div className={styles.text}>
        Wir verwenden Cookies für anonyme Statistik (Google Analytics).
      </div>

      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.allow}`} onClick={allow}>
          Erlauben
        </button>
        <button className={`${styles.btn} ${styles.deny}`} onClick={deny}>
          Ablehnen
        </button>
      </div>
    </div>
  );
}
