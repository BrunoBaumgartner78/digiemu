// src/components/checkout/BuyButton.tsx
"use client";

import { useState } from "react";
import { getErrorMessage } from "@/lib/errors";

type BuyButtonProps = {
  productId: string;
};

export function BuyButton({ productId }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        let message = "Checkout konnte nicht gestartet werden.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // ignore JSON-Fehler
        }
        throw new Error(message);
      }

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Keine Checkout-URL vom Server erhalten.");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unbekannter Fehler beim Checkout."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="neobtn primary"
        aria-busy={loading}
        aria-live="polite"
      >
        {loading ? "Weiterleitung zu Stripe…" : "Einmal zahlen · sofort laden"}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-2 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
