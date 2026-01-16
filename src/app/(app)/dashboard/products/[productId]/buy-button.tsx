"use client";
import { useState } from "react";

export default function BuyButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [disabled, setDisabled] = useState(false);

  async function handleBuy() {
    if (loading || disabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) {
        window.location.href = `/login?callbackUrl=/product/${productId}`;
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data?.url) {
        setDisabled(true); // Button bleibt disabled nach Erfolg
        window.location.href = data.url;
        return;
      }
      if (data?.error === "PRODUCT_NOT_AVAILABLE") {
        setError("Dieses Produkt ist aktuell nicht verfügbar.");
      } else if (data?.error === "PRODUCT_FILE_MISSING") {
        setError("Dieses Produkt ist noch nicht downloadbereit.");
      } else {
        setError("Es ist ein Fehler aufgetreten. Bitte versuche es erneut.");
      }
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
      <button
        onClick={handleBuy}
        className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded"
        disabled={loading || disabled}
        style={{ minWidth: 180, opacity: loading || disabled ? 0.7 : 1, pointerEvents: loading || disabled ? "none" : undefined }}
      >
        {loading ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span className="spinner" style={{ width: 18, height: 18, border: "2px solid #fff", borderTop: "2px solid #38bdf8", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }} />
            Weiter zu Stripe…
          </span>
        ) : (
          "Jetzt kaufen"
        )}
      </button>
      {error && (
        <div style={{ color: "#b91c1c", fontSize: 14, marginTop: 2 }}>
          {error}
          {retryCount < 1 && (
            <button
              className="neobtn ghost"
              style={{ marginLeft: 12, fontSize: 13 }}
              onClick={() => {
                setRetryCount((c) => c + 1);
                setError(null);
                handleBuy();
              }}
              disabled={loading}
            >
              Erneut versuchen
            </button>
          )}
        </div>
      )}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
