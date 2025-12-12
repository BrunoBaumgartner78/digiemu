"use client";

import { useEffect, useRef } from "react";

/**
 * Track a single product view per mount.
 * Call in a client component with a valid productId.
 */
export function useTrackProductView(productId?: string) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (!productId || sentRef.current) return;
    sentRef.current = true;

    fetch(`/api/product/${productId}/view`, {
      method: "POST",
    }).catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to track product view", err);
      }
    });
  }, [productId]);
}
