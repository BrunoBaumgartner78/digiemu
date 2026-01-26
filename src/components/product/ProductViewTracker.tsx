// src/components/product/ProductViewTracker.tsx
"use client";

import { useEffect } from "react";

export default function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    if (!productId) return;

    fetch("/api/products/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    }).catch((_err) => {
      console.error("Failed to log product view", _err);
    });
  }, [productId]);

  return null;
}
