"use client";

import Image from "next/image";
import Link from "next/link";

type ProductCardProps = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
};

export function ProductCard({ id, title, price, imageUrl }: ProductCardProps) {
  const src = imageUrl && imageUrl.trim().length > 0
    ? imageUrl
    : `/api/media/thumbnail/${encodeURIComponent(id)}?variant=blur`;

  return (
    <div className="neocard group product-card" style={{ display: "flex", flexDirection: "column", height: "100%", alignSelf: "stretch" }}>
      <div className="relative aspect-square overflow-hidden rounded-2xl">
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-3 px-1" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 className="productCardTitle product-card__title text-sm font-medium text-[var(--text)]">{title}</h3>
        <p className="text-sm font-semibold text-[var(--text-soft)]">CHF {price.toFixed(2)}</p>

        <div className="product-card__cta" style={{ marginTop: "auto" }}>
          <Link href={`/product/${id}`} className="neobutton w-full text-center">
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
