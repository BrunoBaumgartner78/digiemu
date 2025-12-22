"use client";

import Link from "next/link";
import * as React from "react";

type Props = {
  vendorProfileId: string;
  children: React.ReactNode;
  className?: string;
  productId?: string;
  source?: string;
};

export default function SellerLink({
  vendorProfileId,
  children,
  className,
}: Props) {
  return (
    <Link
      href={`/seller/${vendorProfileId}`}
      className={className}
      prefetch={false}
      style={{ fontWeight: 700, textDecoration: "none" }}
    >
      {children}
    </Link>
  );
}
