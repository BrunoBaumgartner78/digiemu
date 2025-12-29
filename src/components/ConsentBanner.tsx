"use client";
import { useEffect, useState } from "react";

function applyConsent(consent: boolean) {
  (window as any).gtag?.("consent", "update", {
    analytics_storage: consent ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  if (consent) {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (gaId) {
      (window as any).gtag?.("config", gaId, {
        anonymize_ip: true,
        page_path: window.location.pathname,
      });
    }
  }
}

export default function CookieConsentBanner() {
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("analytics_consent");
      if (stored === null) {
        setConsent(null); // Banner anzeigen
      } else {
        const value = stored === "true";
        setConsent(value);       // Banner ausblenden
        applyConsent(value);     // Consent direkt anwenden
      }
    } catch {
      // Falls localStorage blockiert ist: Banner trotzdem anzeigen
      setConsent(null);
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  // Wenn consent null => noch keine Entscheidung => Banner anzeigen
  if (consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#232323] text-white p-4 flex flex-col md:flex-row items-center justify-between z-50 shadow">
      <span className="mb-2 md:mb-0">
        Statistik erlauben? Wir nutzen DSGVO-freundliche Analytics.
      </span>

      <div className="flex gap-2">
        <button
          className="px-4 py-2 rounded bg-[#39FF14] text-[#1A1A1A] font-semibold"
          onClick={() => {
            try { localStorage.setItem("analytics_consent", "true"); } catch {}
            applyConsent(true);
            setConsent(true);
          }}
        >
          Erlauben
        </button>

        <button
          className="px-4 py-2 rounded border border-[#39FF14] text-white font-semibold"
          onClick={() => {
            try { localStorage.setItem("analytics_consent", "false"); } catch {}
            applyConsent(false);
            setConsent(false);
          }}
        >
          Ablehnen
        </button>
      </div>
    </div>
  );
}
