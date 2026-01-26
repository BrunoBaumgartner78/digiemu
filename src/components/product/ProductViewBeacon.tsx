"use client";
import * as React from "react";

export default function ProductViewBeacon({ productId }: { productId: string }) {
  React.useEffect(() => {
    if (!productId) return;

    // Fire and forget
    fetch(`/api/products/${encodeURIComponent(productId)}/view`, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
      // keepalive helps when navigating away quickly
      keepalive: true,
    }).catch(() => {});
  }, [productId]);

  return null;
}
