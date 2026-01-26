import Link from "next/link";
import Image from "next/image";

export type ProductCardProps = {
  id: string;
  title: string;
  priceCents: number;
  thumbnailUrl?: string | null;
  category?: string;
  vendorName?: string;
  description?: string;
  downloads?: number;
  showBuyButton?: boolean;
};

export function ProductCard({
  id,
  title,
  priceCents,
  thumbnailUrl,
  category,
  vendorName,
  description,
  downloads,
  showBuyButton = true,
}: ProductCardProps) {
  const priceLabel = new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
  }).format(priceCents / 100);

  return (
    <div className="neo-card bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] flex flex-col h-full p-4 rounded-2xl">
      <Link href={`/product/${id}`} className="block">
        <div className="aspect-[4/3] w-full mb-3 rounded-xl overflow-hidden bg-[var(--card-bg)] flex items-center justify-center">
          {thumbnailUrl ? (
            <div className="w-full h-full relative">
              <Image src={thumbnailUrl} alt={title} fill sizes="(min-width:1024px) 25vw, 50vw" style={{ objectFit: "cover" }} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-[var(--text-muted)]">
              <span className="text-3xl mb-1">📄</span>
              <span className="text-xs">Digitales Produkt</span>
            </div>
          )}
        </div>
        <h2 className="text-lg font-semibold leading-tight mb-1 line-clamp-2 text-[var(--text-main)]">{title}</h2>
        <div className="text-xs mb-2 text-[var(--text-muted)] flex gap-2 flex-wrap">
          <span>{priceLabel}</span>
          {category && <span>{category}</span>}
          {vendorName && <span>von {vendorName}</span>}
          {downloads !== undefined && <span>{downloads} Downloads</span>}
        </div>
        {description && (
          <p className="text-xs text-[var(--text-muted)] mb-2 line-clamp-2">
            {description.length > 140 ? description.slice(0, 140) + "…" : description}
          </p>
        )}
        <div className="flex flex-col gap-2 mt-auto">
          {showBuyButton && (
            <button className="neobtn primary w-full">Jetzt kaufen</button>
          )}
          <span className="text-[var(--text-muted)] text-xs text-center">Sichere Zahlung mit Stripe · Sofort-Download</span>
        </div>
      </Link>
    </div>
  );
}
