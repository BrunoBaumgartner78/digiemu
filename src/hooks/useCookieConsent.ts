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
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readFromStorage();
    setConsent(initial);
    setReady(true);
  }, []);

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
        writeToStorage(next);
      },
      rejectAll() {
        const next: ConsentState = {
          necessary: true,
          analytics: false,
          marketing: false,
          ts: Date.now(),
        };
        setConsent(next);
        writeToStorage(next);
      },
      setPartial(partial: Partial<ConsentState>) {
        const next: ConsentState = {
          necessary: partial.necessary ?? consent.necessary ?? true,
          analytics: partial.analytics ?? consent.analytics ?? false,
          marketing: partial.marketing ?? consent.marketing ?? false,
          ts: Date.now(),
        };
        setConsent(next);
        writeToStorage(next);
      },
    };
  }, [ready, consent]);

  return api;
}
