// src/app/layout.tsx
import "./globals.css";
import Script from "next/script";
import { Providers } from "./providers";
import { MainHeader } from "@/components/layout/MainHeader";
import CookieConsentBanner from "@/components/ConsentBanner";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { siteMetadata } from "@/lib/seo/metadata";   // ✅ YAML -> Next metadata

export const metadata = siteMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="de" suppressHydrationWarning>
      <body className="bg-[var(--page-bg)] text-[var(--text-main)]">
        {/* Consent default denied (vor GA) */}
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

        <CookieConsentBanner />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
