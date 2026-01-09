// src/components/marketplace/ProductCard.tsx
"use client";

import Link from "next/link";
import cardStyles from "./ProductCard.module.css";

type ProductCardProps = {
  id: string;
  title: string;
  price?: number; // price in CHF (float) for backward compat
  priceCents?: number; // optional cents value
  category?: string;
  thumbSrc?: string | null; // optional signed proxy URL
};

function formatCHF(priceOrCents: number) {
  if (!priceOrCents) return "CHF 0.00";
  // If value looks like cents (>=1000) treat as cents, otherwise treat as CHF
  const chf = Math.abs(priceOrCents) >= 1000 ? priceOrCents / 100 : priceOrCents;
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(chf);
}

export function ProductCard({ id, title, price = 0, priceCents, category, thumbSrc }: ProductCardProps) {
  const src = thumbSrc && thumbSrc.trim().length > 0 ? thumbSrc : `/api/media/thumbnail/${encodeURIComponent(id)}?variant=blur`;
  const cents = typeof priceCents === "number" ? priceCents : Math.round((price || 0) * 100);

  return (
    <Link href={`/product/${id}`} className={cardStyles.card}>
      <div className={cardStyles.media}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={cardStyles.img}
          loading="lazy"
          decoding="async"
          src={src}
          alt={title}
          referrerPolicy="no-referrer"
          draggable={false}
        />
      </div>

      <div className={cardStyles.body}>
        <h3 className={cardStyles.title}>{title}</h3>

        <div className={cardStyles.metaRow}>
          <span className={cardStyles.pill}>{category ?? "Produkt"}</span>
          <span className={cardStyles.price}>{formatCHF(cents)}</span>
        </div>
      </div>
    </Link>
  );
}
