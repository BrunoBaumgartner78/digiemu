import Link from "next/link";
import Image from "next/image";

export type ProductCardProps = {
  id: string;
  title: string;
  price: number; // in cents
  thumbnail?: string | null;
  category?: string | null;
};

export function ProductCard({ id, title, price, thumbnail, category }: ProductCardProps) {
  const displayPrice = (price ?? 0) / 100;
  const safeAlt = title?.trim() || "Produktbild";

  return (
    <div className="neumorph-card p-4 flex flex-col">
      <Link href={`/product/${id}`} className="block">
        <div className="w-full h-40 rounded-lg overflow-hidden mb-3 bg-black/5">
          <div className="w-full h-full relative">
            <Image
              src={thumbnail || "/placeholder.png"}
              alt={safeAlt}
              fill
              sizes="(min-width:1024px) 25vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        <h2 className="font-semibold text-base mb-1 line-clamp-2">{title}</h2>
      </Link>

      {category && <span className="text-xs opacity-70 mb-1">{category}</span>}

      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="font-bold text-sm">CHF {displayPrice.toFixed(2)}</span>
        <Link href={`/product/${id}`} className="neobtn-sm">
          Details
        </Link>
      </div>
    </div>
  );
}
