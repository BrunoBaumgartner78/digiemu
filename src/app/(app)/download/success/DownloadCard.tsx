"use client";

import { useState } from "react";

type DownloadLink = {
  isActive: boolean;
  downloadCount: number;
  maxDownloads: number;
  // optional aber empfehlenswert später:
  // expiresAt?: string | Date;
};

type Order = {
  id: string;
  status: "PENDING" | "PAID" | "COMPLETED" | "FAILED" | string;
  product: { title: string };
  downloadLink?: DownloadLink | null;
};

export default function DownloadCard({ order }: { order: Order }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dl = order.downloadLink;

  const reachedLimit = !!dl && dl.downloadCount >= dl.maxDownloads;

  const canDownload =
    order.status === "COMPLETED" && // ✅ WICHTIG: nicht mehr PAID
    !!dl &&
    dl.isActive === true &&
    !reachedLimit;

  function handleDownload() {
    setError(null);
    setLoading(true);
    window.location.href = `/api/download/${order.id}`;
    setTimeout(() => setLoading(false), 2000);
  }

  const showProcessing = order.status !== "COMPLETED";

  return (
    <div className="neo-card max-w-lg text-center space-y-4">
      <h1 className="neo-title">🎉 Kauf erfolgreich</h1>

      <p className="neo-text">
        Produkt: <strong>{order.product.title}</strong>
      </p>

      {showProcessing && (
        <p className="neo-warn">
          {order.status === "PENDING"
            ? "Zahlung wird noch verarbeitet. Bitte kurz warten."
            : order.status === "PAID"
            ? "Lieferung wird vorbereitet (Download-Link wird erstellt)…"
            : "Bitte kurz warten…"}
        </p>
      )}

      {dl && (
        <p className="neo-subtext">
          Downloads: {dl.downloadCount} / {dl.maxDownloads}
        </p>
      )}

      {error && <p className="neo-error">{error}</p>}

      <button className="neobtn" disabled={!canDownload || loading} onClick={handleDownload}>
        {loading ? "Lädt…" : "Download starten"}
      </button>

      {!canDownload && dl && (
        <p className="neo-subtext">
          {!dl.isActive
            ? "Download ist deaktiviert."
            : reachedLimit
            ? "Download-Limit erreicht."
            : order.status !== "COMPLETED"
            ? "Lieferung wird vorbereitet – Download-Link wird erstellt. Bitte kurz warten."
            : "Download aktuell nicht verfügbar."}
        </p>

      )}

      {!canDownload && (
        <p className="neo-subtext" style={{ fontSize: 12, opacity: 0.8 }}>
          {/* Temporary debug: status / active / count / max */}
          Debug: status={order.status} active={String(dl?.isActive ?? false)} count={dl?.downloadCount ?? 0}/{dl?.maxDownloads ?? 0}
        </p>
      )}
    </div>
  );
}
