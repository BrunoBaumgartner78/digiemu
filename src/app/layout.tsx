// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { MainHeader } from "@/components/layout/MainHeader";
import { Providers } from "./providers";

export const metadata: Metadata = {
  // deine bestehenden Meta-Angaben hier weiterverwenden
  title: "DigiEmu – Digitaler Marktplatz",
  description: "Digitaler Marktplatz für Creators.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <Providers>
          <MainHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
