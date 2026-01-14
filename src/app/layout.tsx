import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DigiEmu – Digitaler Marktplatz",
  description: "Digitale Produkte kaufen & verkaufen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="bg-[var(--page-bg)] text-[var(--text-main)]">{children}</body>
    </html>
  );
}
