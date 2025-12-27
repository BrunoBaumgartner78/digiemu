"use client";

import { useEffect, useState } from "react";
import styles from "./CookieConsentBanner.module.css";

type ConsentState = "granted" | "denied";
const STORAGE_KEY = "bellu_cookie_consent_v1";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

function setGoogleConsent(state: ConsentState) {
  // gtag wird durch GA Script bereitgestellt; falls noch nicht da: trotzdem speichern, später greift es.
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    analytics_storage: state,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export default function CookieConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ConsentState | null;

    if (!saved) {
      setOpen(true);
      // Default bleibt denied (layout setzt default schon), hier nur sicherheitshalber:
      setGoogleConsent("denied");
      return;
    }

    // bereits entschieden → anwenden
    setGoogleConsent(saved);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "granted");
    setGoogleConsent("granted");
    setOpen(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "denied");
    setGoogleConsent("denied");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Cookie-Einstellungen">
      <div className={styles.panel}>
        <div className={styles.title}>Cookies & Analyse</div>
        <p className={styles.text}>
          Wir verwenden notwendige Cookies für den Betrieb. Mit deiner Zustimmung nutzen wir zusätzlich
          Analyse-Cookies (Google Analytics), um bellu.ch zu verbessern.
        </p>

        <div className={styles.actions}>
          <button className={styles.secondary} onClick={decline}>
            Ablehnen
          </button>
          <button className={styles.primary} onClick={accept}>
            Akzeptieren
          </button>
        </div>

        <p className={styles.hint}>
          Tipp: Wir können später im Footer einen Link „Cookie-Einstellungen“ einbauen, um die Wahl zu ändern.
        </p>
      </div>
    </div>
  );
}
