"use client";

import Link from "next/link";
import { useCookieConsent } from "@/hooks/useCookieConsent";

export default function CookieBanner() {
  const { consent, isReady, acceptAll, acceptNecessary } = useCookieConsent();

  // Show banner only after hydration and only if no consent was stored
  if (!isReady || consent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
      <div className="mx-auto max-w-5xl px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-700">
          <strong>Cookies &amp; Datenschutz</strong>
          <br />
          Wir verwenden notwendige Cookies für den sicheren Betrieb der Website.
          Optionale Cookies (z.&nbsp;B. anonyme Analyse) verwenden wir nur mit Ihrer
          Zustimmung. {" "}
          <Link href="/datenschutz" className="underline" target="_blank">
            Mehr erfahren
          </Link>
        </p>

        <div className="flex gap-2">
          <button
            onClick={acceptNecessary}
            className="px-4 py-2 text-sm border rounded-md"
          >
            Nur notwendige
          </button>
          <button
            onClick={acceptAll}
            className="px-4 py-2 text-sm bg-black text-white rounded-md"
          >
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
