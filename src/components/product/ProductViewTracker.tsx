// src/components/product/ProductViewTracker.tsx
"use client";

import { useEffect } from "react";

export default function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    if (!productId) return;

    fetch("/api/product/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    }).catch((_err) => {
      console.error("Failed to log product view", err);
    });
  }, [productId]);

  return null;
}
