"use client";

import { useEffect, useState } from "react";
import styles from "./CookieConsentBanner.module.css";

const STORAGE_KEY = "analytics_consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // ✅ im Client ok (NEXT_PUBLIC)

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setVisible(stored !== "true" && stored !== "false");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const allow = () => {
    localStorage.setItem(STORAGE_KEY, "true");

    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });

    // ✅ Nach Consent nochmal config + page_view schicken (macht Realtime zuverlässig)
    if (GA_ID) {
      window.gtag?.("config", GA_ID, {
        anonymize_ip: true,
        send_page_view: true,
      });
    }
    window.gtag?.("event", "page_view");
    window.gtag?.("event", "consent_granted");

    setVisible(false);
  };

  const deny = () => {
    localStorage.setItem(STORAGE_KEY, "false");
    window.gtag?.("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    setVisible(false);
  };

  return (
    <div className={styles.wrap} data-cookie-banner="1" role="dialog" aria-modal="true">
      <div className={styles.panel}>
        <div className={styles.head}>
          <div className={styles.title}>Cookies & Statistik</div>
          <div className={styles.text}>
            Wir verwenden Cookies für anonyme Statistik (Google Analytics). Du kannst die Entscheidung jederzeit in deinem
            Browser löschen.
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.secondary} onClick={deny} type="button">
            Ablehnen
          </button>
          <button className={styles.primary} onClick={allow} type="button">
            Erlauben
          </button>
        </div>
      </div>
    </div>
  );
}
