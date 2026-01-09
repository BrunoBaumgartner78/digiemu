"use client";
import { useState } from "react";

export function DownloadButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/download/${orderId}`);
      if (res.status === 401) {
        window.location.href = `/login?callbackUrl=/download/${orderId}`;
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "UNBEKANNTER_FEHLER");
        setLoading(false);
        return;
      }
      // Redirect to file (API returns redirect)
      window.location.href = `/api/download/${orderId}`;
    } catch (e) {
      setError("NETWORK_ERROR");
      setLoading(false);
    }
  }

  function getErrorMessage(code: string) {
    switch (code) {
      case "EXPIRED":
        return "Download-Link abgelaufen.";
      case "DOWNLOAD_LIMIT_REACHED":
        return "Download-Limit erreicht.";
      case "INACTIVE":
        return "Download-Link deaktiviert.";
      case "NOT_PAID":
        return "Zahlung nicht abgeschlossen.";
      case "NO_LINK":
        return "Kein Download-Link verfügbar.";
      case "FORBIDDEN":
        return "Kein Zugriff auf diese Bestellung.";
      case "UNAUTHORIZED":
        return "Nicht eingeloggt. Bitte erneut anmelden.";
      default:
        return "Unbekannter Fehler. Bitte Support kontaktieren.";
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        className="neobtn primary"
        onClick={handleDownload}
        disabled={loading}
        style={{ minWidth: 180 }}
      >
        {loading ? "Download wird vorbereitet…" : "Jetzt herunterladen"}
      </button>
      {error && (
        <div style={{ marginTop: 8, color: "#b91c1c" }}>
          <div>{getErrorMessage(error)}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
            <a href="/help" className="neobtn primary">
              Hilfe & FAQ
            </a>
            {retryCount < 1 && (
              <button
                className="neobtn ghost"
                onClick={() => {
                  setRetryCount((c) => c + 1);
                  setError(null);
                  handleDownload();
                }}
                disabled={loading}
              >
                Erneut versuchen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
