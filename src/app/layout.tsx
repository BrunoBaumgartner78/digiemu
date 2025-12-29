import "./globals.css";
import { Providers } from "./providers";
import { MainHeader } from "@/components/layout/MainHeader";
import CookieConsentBanner from "@/components/cookies/CookieConsentBanner";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <Providers>
          <MainHeader />
          <div className="page-shell">
            <main className="page-main">{children}</main>
          </div>

          {/* Banner kann innerhalb der Providers bleiben */}
          <CookieConsentBanner />
          {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
        </Providers>
      </body>
    </html>
  );
}
