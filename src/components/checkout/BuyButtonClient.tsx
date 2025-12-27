"use client";

import * as React from "react";
import DigitalConsent from "@/components/checkout/DigitalConsent";

type Props = {
  productId: string;
};

type UiError = { code: string; title: string; message: string; help?: boolean };

export default function BuyButtonClient({ productId }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<UiError | null>(null);
  const [consent, setConsent] = React.useState(false);


  // ✅ useRef = Lock (keine Rerenders nötig)
  const inFlightRef = React.useRef(false);

  // ✅ Timeout / Abort sauber ohne extra State
  const abortRef = React.useRef<AbortController | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Error mapping
  function mapError(code: string): { title: string; message: string; help?: boolean } {
    switch (code) {
      case "PRODUCT_NOT_AVAILABLE":
        return {
          title: "Produkt nicht verfügbar",
          message: "Dieses Produkt ist aktuell nicht verfügbar. Bitte später erneut versuchen.",
        };
      case "PRODUCT_FILE_MISSING":
        return {
          title: "Download nicht bereit",
          message: "Für dieses Produkt ist noch keine Datei hinterlegt. Bitte kontaktiere den Support.",
          help: true,
        };
      case "FORBIDDEN":
        return { title: "Kein Zugriff", message: "Du hast keine Berechtigung für diesen Kauf." };
      case "RATE_LIMITED":
        return { title: "Zu viele Versuche", message: "Bitte warte kurz und versuche es erneut." };
      case "TIMEOUT":
        return { title: "Timeout", message: "Bitte erneut versuchen." };
      default:
        return { title: "Checkout fehlgeschlagen", message: "Etwas ist schiefgelaufen. Bitte versuche es erneut." };
    }
  }

  function clearGuards() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
      abortRef.current = null;
    }
  }

  React.useEffect(() => {
    return () => {
      clearGuards();
      inFlightRef.current = false;
    };
  }, []);

  async function onBuy() {
    if (loading || inFlightRef.current) return;
    if (!productId) {
      setError({ code: "GENERIC", ...mapError("GENERIC") });
      return;
    }
    if (!consent) {
      setError({ code: "CONSENT_REQUIRED", title: "Einwilligung benötigt", message: "Bitte bestätige den Hinweis zu digitalen Inhalten (Widerruf)." });
      return;
    }

    setLoading(true);
    setError(null);
    inFlightRef.current = true;

    // ✅ Abort + Timeout
    const controller = new AbortController();
    abortRef.current = controller;

    timeoutRef.current = setTimeout(() => {
      // Abort fetch, UI wird im catch/finally sauber gesetzt
      try {
        controller.abort();
      } catch {}
    }, 12000);

    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ productId, digitalConsent: true }),
      });

      // UNAUTHORIZED: redirect to login with callback
      if (res.status === 401) {
        const cb = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?callbackUrl=${cb}`;
        return;
      }

      const data = await res.json().catch(() => ({} as any));

      if (res.ok && data?.url) {
        // redirect to Stripe
        window.location.assign(String(data.url));
        return;
      }

      // Map known errors
      const code = String(data?.error || "GENERIC");
      setError({ code, ...mapError(code) });
    } catch (e: any) {
      const isAbort = e?.name === "AbortError";
      const code = isAbort ? "TIMEOUT" : "GENERIC";
      setError({ code, ...mapError(code) });
    } finally {
      clearGuards();
      setLoading(false);
      inFlightRef.current = false;
    }
  }

  function handleRetry() {
    setError(null);
    onBuy();
  }

  const isDisabled = loading || inFlightRef.current;

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <DigitalConsent value={consent} onChange={setConsent} />
      {/* Consent text now only shown above button on product page, not here */}
      <button
        type="button"
        className="neobtn primary"
        onClick={onBuy}
        disabled={isDisabled}
        style={{ minWidth: 160, opacity: loading ? 0.7 : 1 }}
      >
        {loading ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span
              className="spinner"
              style={{
                width: 18,
                height: 18,
                border: "2px solid #fff",
                borderTop: "2px solid #38bdf8",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 1s linear infinite",
              }}
            />
            Weiterleiten…
          </span>
        ) : (
          "Jetzt kaufen"
        )}
      </button>

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
        🔒 Sicherer Checkout · Sofortiger Download · Keine versteckten Gebühren
      </div>

      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8, lineHeight: 1.5 }}>
        Mit dem Kauf stimme ich den {" "}
        <a href="/legal/agb" className="neo-link">AGB</a>{" "}
        zu und verzichte auf das Widerrufsrecht nach Download.
      </div>

      {error && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 8px #0001",
            padding: 14,
            color: "#b91c1c",
            fontSize: 15,
            marginTop: 2,
            border: "1px solid #eee",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{error.title}</div>
          <div style={{ marginBottom: 8 }}>{error.message}</div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="neobtn ghost"
              style={{ fontSize: 14, minWidth: 0, padding: "4px 14px" }}
              onClick={handleRetry}
              disabled={isDisabled}
            >
              Erneut versuchen
            </button>

            {error.code === "PRODUCT_FILE_MISSING" || error.code === "GENERIC" ? (
              <a href="/help" className="neobtn ghost" style={{ fontSize: 14, minWidth: 0, padding: "4px 14px" }}>
                Hilfe
              </a>
            ) : null}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
