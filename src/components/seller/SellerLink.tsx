"use client";

import Link from "next/link";
import * as React from "react";
import sellerPublicUrl from "@/lib/vendorProfiles";
import { marketplaceTenant } from "@/lib/marketplaceTenant";
import { sellerProfilePath } from "@/lib/tenants/shell";

type Props = {
  vendorProfileId?: string | null;
  slug?: string | null;
  tenantKey?: string | null;
  children: React.ReactNode;
  className?: string;
  productId?: string;
  source?: string;
};

export default function SellerLink({ vendorProfileId, slug, children, className, productId, source }: Props) {
  if (!vendorProfileId) return <>{children}</>;

  // Build path via tenant shell helper
  const mp = marketplaceTenant();
  const href = sellerProfilePath({ tenantKey: tenantKey ?? mp.key ?? "MARKETPLACE", vendorProfileId });

  const handleClick = (e: React.MouseEvent) => {
    try {
      const payload = JSON.stringify({ productId: productId ?? null, source: source ?? null, vendorProfileId });
      if (typeof navigator !== "undefined" && typeof (navigator as any).sendBeacon === "function") {
        const blob = new Blob([payload], { type: "application/json" });
        try {
          (navigator as any).sendBeacon("/api/track/seller-click", blob);
        } catch (err) {
          // best-effort, swallow
        }
      } else {
        // best-effort fetch that doesn't block navigation
        fetch("/api/track/seller-click", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
      }
    } catch (err) {
      // ignore
    }
  };

  return (
    <Link href={href} className={className} prefetch={false} onClick={handleClick} style={{ fontWeight: 700, textDecoration: "none" }}>
      {children}
    </Link>
  );
}
