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

  useEffect(() => {
    try {
      const stored = localStorage.getItem("analytics_consent");
      setVisible(stored === null);
      console.log("[CookieConsentBanner] mounted, stored =", stored);
    } catch {
      // Falls localStorage geblockt ist: zeig Banner trotzdem
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem("analytics_consent", "true");
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("analytics_consent", "false");
    window.gtag?.("consent", "update", { analytics_storage: "denied" });
    setVisible(false);
  };

  return (
    <div className={styles.overlay} data-cookie-banner="1">
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Cookie Einwilligung">
        <div className={styles.title}>Cookies & Statistik</div>
        <p className={styles.text}>
          Wir verwenden Cookies für anonyme Statistik (Google Analytics). Du kannst zustimmen oder ablehnen.
        </p>

        <div className={styles.actions}>
          <button className={styles.secondary} onClick={decline}>
            Ablehnen
          </button>
          <button className={styles.primary} onClick={accept}>
            Erlauben
          </button>
        </div>

        <p className={styles.hint}>
          Hinweis: Du kannst deine Entscheidung jederzeit ändern, indem du den Browser-Speicher löschst.
        </p>
      </div>
    </div>
  );
}
