"use client";
import { useEffect, useState } from "react";

const ANALYTICS_SCRIPT = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL;

export default function ConsentBanner() {
  const [show, setShow] = useState(false);
  const [consent, setConsent] = useState<null | boolean>(null);

  useEffect(() => {
    setTimeout(() => {
      const stored = localStorage.getItem("analytics_consent");
      if (stored === null) {
        setShow(true);
        return;
      }
      setConsent(stored === "true");
    }, 0);
  }, []);

  useEffect(() => {
    if (consent) {
      // Script nur bei Zustimmung laden
      if (ANALYTICS_SCRIPT && !document.getElementById("analytics-script")) {
        const script = document.createElement("script");
        script.src = ANALYTICS_SCRIPT;
        script.async = true;
        script.id = "analytics-script";
        document.body.appendChild(script);
      }
    }
  }, [consent]);

  if (consent !== null || !show) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#232323] text-white p-4 flex flex-col md:flex-row items-center justify-between z-50 shadow">
      <span className="mb-2 md:mb-0">Statistik erlauben? Wir nutzen DSGVO-freundliche Analytics.</span>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 rounded bg-[#39FF14] text-[#1A1A1A] font-semibold"
          onClick={() => {
            localStorage.setItem("analytics_consent", "true");
            setConsent(true);
            setShow(false);
          }}
        >
          Erlauben
        </button>
        <button
          className="px-4 py-2 rounded border border-[#39FF14] text-white font-semibold"
          onClick={() => {
            localStorage.setItem("analytics_consent", "false");
            setConsent(false);
            setShow(false);
          }}
        >
          Ablehnen
        </button>
      </div>
    </div>
  );
}
