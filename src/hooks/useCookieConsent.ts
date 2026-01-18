"use client";

import { useEffect, useState } from "react";

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
};

const STORAGE_KEY = "cookie-consent";

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setConsent(JSON.parse(stored));
    } catch {
      // ignore
    } finally {
      setIsReady(true);
    }
  }, []);

  const saveConsent = (value: CookieConsent) => {
    setConsent(value);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    // Notify other client components in the same tab that consent changed
    try {
      window.dispatchEvent(new Event("cookie-consent-updated"));
    } catch {
      // ignore (e.g., non-window environments)
    }
    } catch {
      // ignore
    }
  };

  return {
    consent,
    isReady,
    acceptAll: () => saveConsent({ necessary: true, analytics: true }),
    acceptNecessary: () => saveConsent({ necessary: true, analytics: false }),
  };
}
