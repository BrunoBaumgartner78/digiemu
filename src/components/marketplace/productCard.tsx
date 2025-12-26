// src/components/marketplace/ProductCard.tsx
"use client";

import Link from "next/link";

type ProductCardProps = {
  id: string;
  title: string;
  price: number;
  thumbSrc?: string | null; // ✅ signierter Proxy-URL vom Server
};

export function ProductCard({ id, title, price, thumbSrc }: ProductCardProps) {
  return (
    <div className="neocard group">
      <div className="relative aspect-square overflow-hidden rounded-2xl">
        {thumbSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-3xl opacity-70">
            💾
          </div>
        )}
      </div>

      <div className="mt-3 px-1 space-y-1">
        <h3 className="text-sm font-medium text-[var(--text)] line-clamp-2">{title}</h3>
        <p className="text-sm font-semibold text-[var(--text-soft)]">CHF {price.toFixed(2)}</p>
      </div>

      <div className="mt-3">
        <Link href={`/product/${id}`} className="neobutton w-full text-center">
          Details
        </Link>
      </div>
    </div>
  );
}
