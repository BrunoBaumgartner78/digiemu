import "./globals.css";
import type { Metadata, Viewport } from "next";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/components/ui/use-toast";
import CookieBanner from "@/components/legal/CookieBanner";
import AnalyticsLoader from "@/components/analytics/AnalyticsLoader";
import TraceRepeatClient from "./_traceRepeatClient";

export const viewport: Viewport = {
  themeColor: "#EAF1FF",
};

const SITE_NAME = "Bellu";
const SITE_TITLE = "Bellu – Digitaler Marktplatz";
const SITE_DESCRIPTION = "Digitale Produkte kaufen & verkaufen.";

// ✅ Exakt die Domain verwenden, die du teilst (mit/ohne www)
const SITE_URL = "https://www.bellu.ch";

// ✅ OG Images (plattform-sicher)
const OG_IMAGE_16_9 = "/og-1200x630.png";
const OG_IMAGE_1_1 = "/og-1200x1200.png";

// ✅ FB App ID (für den Debugger-Warnhinweis)
const FB_APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,

  applicationName: SITE_NAME,
  keywords: [
    "Bellu",
    "DigiEmu",
    "digitaler Marktplatz",
    "digitale Produkte",
    "Downloads",
    "Creator",
    "Vendor",
    "Schweiz",
  ],
  authors: [{ name: "Bruno Baumgartner" }],
  creator: "Bruno Baumgartner",
  publisher: SITE_NAME,

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#0ea5e9" }],
  },

  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "de_CH",
    images: [
      { url: OG_IMAGE_16_9, width: 1200, height: 630, alt: SITE_TITLE },
      { url: OG_IMAGE_1_1, width: 1200, height: 1200, alt: SITE_TITLE },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_16_9],
  },

  // ✅ Hier kommt fb:app_id rein (damit der Warnhinweis weg ist)
  // Next.js erlaubt "other" für Custom Meta-Tags.
  ...(FB_APP_ID
    ? {
        other: {
          "fb:app_id": FB_APP_ID,
        },
      }
    : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="bg-[var(--page-bg)] text-[var(--text-main)]">
        <ThemeProvider>
          <ToastProvider>
            {children}
            <TraceRepeatClient />
          </ToastProvider>
        </ThemeProvider>
        <CookieBanner />
        <AnalyticsLoader />
      </body>
    </html>
  );
}
