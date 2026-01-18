"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type Consent = { necessary: true; analytics: boolean };

const KEY = "cookie-consent";

function safeParse(raw: string | null): Consent | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Consent>;
    if (v && v.necessary === true && typeof v.analytics === "boolean") {
      return { necessary: true, analytics: v.analytics };
    }
    return null;
  } catch {
    return null;
  }
}

export default function AnalyticsLoader() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const consent = safeParse(localStorage.getItem(KEY));
    setAllowed(Boolean(consent?.analytics));
  }, []);

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!allowed) return null;

  if (!gaId) return null;

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);} 
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    anonymize_ip: true
                  });
                `}
      </Script>
    </>
  );
}
