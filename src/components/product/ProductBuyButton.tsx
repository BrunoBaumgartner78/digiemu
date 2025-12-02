"use client";
import { useState } from "react";

type ProductBuyButtonProps = {
  productId: string;
  userId?: string; // optional, Gast-Checkout möglich
};

export function ProductBuyButton({ productId, userId }: ProductBuyButtonProps) {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);

    const res = await fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, userId }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Fehler beim Starten des Kaufvorgangs.");
    }

    setLoading(false);
  }

  return (
    <button
      onClick={startCheckout}
      disabled={loading}
      className="px-6 py-2 rounded-full bg-blue-600 text-white shadow-xl"
    >
      {loading ? "Lädt..." : "Jetzt kaufen"}
    </button>
  );
}
