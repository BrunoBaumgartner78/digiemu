import "./globals.css";
import Script from "next/script";
import { Providers } from "./providers";
import { MainHeader } from "@/components/layout/MainHeader";
import CookieConsentBanner from "@/components/cookies/CookieConsentBanner";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        {/* GA Basis-Skript */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-base" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;

                gtag('consent', 'default', {
                  analytics_storage: 'denied'
                });
              `}
            </Script>
          </>
        )}

        <Providers>
          <MainHeader />
          <main>{children}</main>
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
