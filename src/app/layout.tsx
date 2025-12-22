// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { MainHeader } from "@/components/layout/MainHeader";

export const metadata: Metadata = {
  title: "DigiEmu – Digitaler Marktplatz",
  description: "Digitale Produkte kaufen & verkaufen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="bg-[var(--page-bg)] text-[var(--text-main)]">
        <Providers>
          <MainHeader />
          <div className="page-shell">
            <main className="page-main">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
