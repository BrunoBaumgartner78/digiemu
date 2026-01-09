"use client";

import Script from "next/script";

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
  if (!gaId) return null;

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />

      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;

          ${isDev ? "gtag('set','debug_mode',true);" : ""}

          // Consent default: denied (vor config!)
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });

          gtag('js', new Date());

          // Kein automatischer page_view vor Consent
          gtag('config', '${gaId}', {
            anonymize_ip: true,
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}
