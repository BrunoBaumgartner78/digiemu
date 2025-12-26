"use client";

import Link from "next/link";
import * as React from "react";

type Props = {
  vendorProfileId?: string | null;
  children: React.ReactNode;
  className?: string;
  productId?: string;
  source?: string;
};

export default function SellerLink({ vendorProfileId, children, className }: Props) {
  if (!vendorProfileId) return <>{children}</>;

  return (
    <Link
      href={`/seller/${encodeURIComponent(vendorProfileId)}`}
      className={className}
      prefetch={false}
      style={{ fontWeight: 700, textDecoration: "none" }}
    >
      {children}
    </Link>
  );
}
