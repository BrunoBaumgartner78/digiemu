// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { Providers } from "./providers";
import { MainHeader } from "@/components/layout/MainHeader";
import CookieConsentBanner from "@/components/cookies/CookieConsentBanner";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

export const metadata: Metadata = {
  title: "DigiEmu – Digitaler Marktplatz",
  description: "Digitale Produkte kaufen & verkaufen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="de" suppressHydrationWarning>
      <body className="bg-[var(--page-bg)] text-[var(--text-main)]">
        {/* ✅ 1) Google Consent Mode – DEFAULT = DENIED (VOR Analytics!) */}
        {gaId && (
          <Script id="google-consent-default" strategy="beforeInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
            `}
          </Script>
        )}

        <Providers>
          <MainHeader />
          <div className="page-shell">
            <main className="page-main">{children}</main>
          </div>
        </Providers>

        {/* ✅ 2) Cookie Banner (setzt später granted/denied per update) */}
        <CookieConsentBanner />

        {/* ✅ 3) Google Analytics (liest Consent Mode korrekt aus) */}
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
