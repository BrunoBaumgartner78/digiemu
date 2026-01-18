"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type Consent = { necessary: true; analytics: boolean };
const KEY = "cookie-consent-v1";

function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<Consent>;
    return parsed?.analytics === true;
  } catch {
    return false;
  }
}

export default function AnalyticsLoader() {
  const GA_ID = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").trim();

  const [enabled, setEnabled] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  // ensure one-time load
  const loadedRef = useRef(false);

  useEffect(() => {
    // initial
    setEnabled(hasAnalyticsConsent());

    const onChange = () => setEnabled(hasAnalyticsConsent());
    window.addEventListener("cookie-consent-changed", onChange);

    // optional: catches changes from other tabs too
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) onChange();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("cookie-consent-changed", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    // debug (hilft dir sofort)
    console.log("[AnalyticsLoader] state", { GA_ID: GA_ID ? "set" : "missing", enabled });

    if (!GA_ID) return;
    if (!enabled) return;
    if (loadedRef.current) return;

    loadedRef.current = true;
    setShouldLoad(true);
  }, [GA_ID, enabled]);

  if (!shouldLoad) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
