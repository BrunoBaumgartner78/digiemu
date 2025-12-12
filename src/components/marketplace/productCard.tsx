"use client";

import Image from "next/image";
import Link from "next/link";

type ProductCardProps = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
};

export function ProductCard({
  id,
  title,
  price,
  imageUrl,
}: ProductCardProps) {
  return (
    <div className="neocard group">
      <div className="relative aspect-square overflow-hidden rounded-2xl">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-3 px-1 space-y-1">
        <h3 className="text-sm font-medium text-[var(--text)] line-clamp-2">
          {title}
        </h3>

        <p className="text-sm font-semibold text-[var(--text-soft)]">
          CHF {price.toFixed(2)}
        </p>
      </div>

      <div className="mt-3">
        <Link href={`/product/${id}`} className="neobutton w-full text-center">
          Details
        </Link>
      </div>
    </div>
  );
}
