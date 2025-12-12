// src/components/checkout/BuyButton.tsx
"use client";

import { useState } from "react";

type BuyButtonProps = {
  productId: string;
};

export function BuyButton({ productId }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Checkout konnte nicht gestartet werden.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Keine Checkout-URL erhalten.");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setError("Netzwerkfehler beim Checkout.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="neobtn primary w-full md:w-auto"
        aria-busy={loading ? "true" : "false"}
      >
        {loading ? "Weiterleiten…" : "Einmal zahlen · sofort laden"}
      </button>
      {error && (
        <p
          className="text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
