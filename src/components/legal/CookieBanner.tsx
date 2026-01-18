"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./CookieBanner.module.css";

type Consent = { necessary: true; analytics: boolean };

const KEY = "cookie-consent-v1";

function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<Consent>;

    if (typeof parsed?.analytics !== "boolean") return null;

    // necessary ist immer true (hard-coded)
    return { necessary: true, analytics: parsed.analytics };
  } catch {
    return null;
  }
}

function writeConsent(v: Consent) {
  localStorage.setItem(KEY, JSON.stringify(v));
  // custom event for same-tab listeners
  window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: v }));
}

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    setMounted(true);
    setConsent(readConsent());
  }, []);

  const isOpen = useMemo(() => mounted && consent === null, [mounted, consent]);

  if (!isOpen) return null;

  return (
  <div className={styles.wrapper} role="dialog" aria-live="polite" aria-label="Cookie Einstellungen">
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={styles.text}>
          <strong>Cookies</strong>
          <div className={styles.muted}>
            Wir verwenden notwendige Cookies für die Funktion der Website. Optionale Cookies (Analytics) helfen uns,
            die Nutzung zu verstehen und zu verbessern.
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btn}
            onClick={() => {
              const v: Consent = { necessary: true, analytics: false };
              writeConsent(v);
              setConsent(v);
            }}
          >
            Ablehnen
          </button>

          <button
            className={`${styles.btn} ${styles.primary}`}
            onClick={() => {
              const v: Consent = { necessary: true, analytics: true };
              writeConsent(v);
              setConsent(v);
            }}
          >
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  </div>
);
}