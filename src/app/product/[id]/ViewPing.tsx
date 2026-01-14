"use client";
import * as React from "react";

export default function ViewPing({ productId }: { productId: string }) {
  React.useEffect(() => {
    if (!productId) return;

    fetch(`/api/product/${encodeURIComponent(productId)}/view`, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
    }).catch(() => {});
  }, [productId]);

  return null;
}
