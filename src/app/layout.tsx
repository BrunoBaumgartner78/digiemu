import "./globals.css";
import type { Metadata } from "next";
import CookieBanner from "@/components/legal/CookieBanner";

export const metadata: Metadata = {
  title: "DigiEmu – Digitaler Marktplatz",
  description: "Digitale Produkte kaufen & verkaufen.",
  themeColor: "#0ea5e9",
 icons: {
  icon: [
    { url: "/favicon.ico" },
    { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
  ],
  shortcut: ["/favicon.ico"],
  apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  other: [
    { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#0ea5e9" },
  ],
},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="bg-[var(--page-bg)] text-[var(--text-main)]">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
