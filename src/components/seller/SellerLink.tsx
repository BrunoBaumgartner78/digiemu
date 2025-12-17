"use client";

import Link from "next/link";
import React from "react";

type Props = {
  vendorProfileId: string;
  productId?: string;
  source?: string;
  className?: string;
  children: React.ReactNode;
};

export default function SellerLink({
  vendorProfileId,
  productId,
  source = "unknown",
  className,
  children,
}: Props) {
  const href = `/seller/${vendorProfileId}`;

  const track = () => {
    const payload = JSON.stringify({
      vendorProfileId,
      productId: productId ?? null,
      source,
      ts: Date.now(),
    });

    // sendBeacon falls vorhanden, sonst fetch
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/track/seller-click", blob);
      return;
    }

    // fallback
    fetch("/api/track/seller-click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  };

  return (
    <Link href={href} className={className} onClick={track}>
      {children}
    </Link>
  );
}
