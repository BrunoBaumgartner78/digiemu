"use client";

import * as React from "react";

export default function ProductViewTracker({ productId }: { productId: string }) {
  React.useEffect(() => {
    if (!productId) return;

    // ✅ dedupe: pro Tab + Produkt nur 1 View / 30min
    const key = `viewed:${productId}`;
    const last = Number(sessionStorage.getItem(key) ?? "0");
    const now = Date.now();
    const THIRTY_MIN = 30 * 60 * 1000;
    if (now - last < THIRTY_MIN) return;
    sessionStorage.setItem(key, String(now));

    // ✅ fire & forget
    fetch("/api/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId }),
      keepalive: true,
      cache: "no-store",
    }).catch(() => {});
  }, [productId]);

  return null;
}
