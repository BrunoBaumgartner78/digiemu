"use client";

import React, { useState } from "react";
// router not needed here

type Props = { productId: string };

export default function BuyButton({ productId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  async function handleBuy() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || json?.message || "Checkout start failed");

      const url = json?.url;
      if (!url) throw new Error("Keine Checkout-URL erhalten");

      // Redirect browser to Stripe Checkout
      window.location.href = url;
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Unbekannter Fehler beim Checkout");
      else setError(String(err) || "Unbekannter Fehler beim Checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="neo-cta" onClick={handleBuy} disabled={loading} aria-busy={loading}>
        {loading ? "Weiterleitung…" : "Kaufen"}
      </button>
      {error && <div style={{ marginTop: 8, color: "var(--danger, #dc2626)" }}>{error}</div>}
    </div>
  );
}
