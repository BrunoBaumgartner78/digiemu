import "./globals.css";
import { currentTenant } from "@/lib/tenant-context";
import { Providers } from "./providers";
import { MainHeader } from "@/components/layout/MainHeader";
import CookieConsentBanner from "@/components/cookies/CookieConsentBanner";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import ToasterMount from "@/components/ToasterMount";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await currentTenant();
  const tenantKey = (tenant?.key ?? "DEFAULT").toLowerCase();

  return (
    <html lang="de" suppressHydrationWarning data-tenant={tenantKey}>
      <body>
        <Providers>
          <MainHeader />
          <div className="page-shell">
            <main className="page-main">{children}</main>
          </div>

          {/* Banner kann innerhalb der Providers bleiben */}
          <CookieConsentBanner />
          <ToasterMount />
          {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
        </Providers>
      </body>
    </html>
  );
}
