"use client";

import { useEffect, useMemo, useState } from "react";
import { safeJsonParse } from "@/lib/utils/safeJson";

type ConsentState = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  ts?: number;
};

const STORAGE_KEY = "cookieConsent";

const DEFAULT_STATE: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  ts: Date.now(),
};

function readFromStorage(): ConsentState {
  if (typeof window === "undefined") return DEFAULT_STATE;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = safeJsonParse<Partial<ConsentState>>(raw, {});
  return {
    necessary: parsed.necessary ?? true,
    analytics: parsed.analytics ?? false,
    marketing: parsed.marketing ?? false,
    ts: parsed.ts ?? Date.now(),
  };
}

function writeToStorage(next: ConsentState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function useCookieConsent() {
  // initial synchron aus storage laden (kein setState im effect nötig)
  const [consent, setConsent] = useState<ConsentState>(() => readFromStorage());
  // ready ist sofort true, weil initial state bereits geladen ist
  const [ready] = useState(true);

  // optional: wenn du willst, dass externe Änderungen (z.B. localStorage im selben Tab)
  // reingesynct werden, könnte man hier einen storage-event listener ergänzen.
  // Aktuell nicht nötig → wir vermeiden setState-in-effect.

  // Persistiere, wenn consent sich ändert (Effect = sync mit externem System)
  useEffect(() => {
    writeToStorage(consent);
  }, [consent]);

  const api = useMemo(() => {
    return {
      ready,
      consent,
      acceptAll() {
        const next: ConsentState = {
          necessary: true,
          analytics: true,
          marketing: true,
          ts: Date.now(),
        };
        setConsent(next);
      },
      rejectAll() {
        const next: ConsentState = {
          necessary: true,
          analytics: false,
          marketing: false,
          ts: Date.now(),
        };
        setConsent(next);
      },
      setPartial(partial: Partial<ConsentState>) {
        const next: ConsentState = {
          necessary: partial.necessary ?? consent.necessary ?? true,
          analytics: partial.analytics ?? consent.analytics ?? false,
          marketing: partial.marketing ?? consent.marketing ?? false,
          ts: Date.now(),
        };
        setConsent(next);
      },
    };
  }, [ready, consent]);

  return api;
}
