"use client";

import { useState } from "react";

type DownloadLink = {
  isActive: boolean;
  downloadCount: number;
  maxDownloads: number;
};

type Order = {
  id: string;
  status: "PAID" | "PENDING" | "FAILED" | string;
  product: { title: string };
  downloadLink?: DownloadLink | null;
};

export default function DownloadCard({ order }: { order: Order }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDownload =
    order.status === "PAID" &&
    !!order.downloadLink &&
    order.downloadLink.isActive &&
    order.downloadLink.downloadCount < order.downloadLink.maxDownloads;

  function handleDownload() {
    setError(null);
    setLoading(true);

    // ✅ Browser-Navigation (statt fetch) -> Redirect/Download stabil
    window.location.href = `/api/download/${order.id}`;

    // optional: falls User zurück kommt
    setTimeout(() => setLoading(false), 2000);
  }

  return (
    <div className="neo-card max-w-lg text-center space-y-4">
      <h1 className="neo-title">🎉 Kauf erfolgreich</h1>

      <p className="neo-text">
        Produkt: <strong>{order.product.title}</strong>
      </p>

      {order.status !== "PAID" && (
        <p className="neo-warn">Zahlung wird noch verarbeitet. Bitte kurz warten.</p>
      )}

      {order.downloadLink && (
        <p className="neo-subtext">
          Downloads: {order.downloadLink.downloadCount} / {order.downloadLink.maxDownloads}
        </p>
      )}

      {error && <p className="neo-error">{error}</p>}

      <button className="neobtn" disabled={!canDownload || loading} onClick={handleDownload}>
        {loading ? "Lädt…" : "Download starten"}
      </button>

      {!canDownload && order.downloadLink && (
        <p className="neo-subtext">Download-Limit erreicht oder Link abgelaufen.</p>
      )}
    </div>
  );
}
