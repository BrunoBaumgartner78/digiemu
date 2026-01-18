"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type Consent = { necessary: true; analytics: boolean };
const KEY = "cookie-consent-v1";

function hasAnalyticsConsent() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Consent;
    return parsed?.analytics === true;
  } catch {
    return false;
  }
}

export default function AnalyticsLoader() {
  const [enabled, setEnabled] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    // initial
    setEnabled(hasAnalyticsConsent());

    const onChange = () => setEnabled(hasAnalyticsConsent());
    window.addEventListener("cookie-consent-changed", onChange);

    return () => window.removeEventListener("cookie-consent-changed", onChange);
  }, []);

  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Never load twice
  if (!GA_ID) return null;
  if (!enabled) return null;
  if (loadedRef.current) return null;
  loadedRef.current = true;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
