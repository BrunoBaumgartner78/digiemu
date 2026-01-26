"use client";
import Image from "next/image";

export type ProductCardProps = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  thumbnail?: string;
  isActive?: boolean;
  createdAt?: string;
  vendorName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function ProductCard({
  title,
  description,
  priceCents,
  thumbnail,
  isActive = true,
  createdAt,
  vendorName,
  onEdit,
  onDelete,
}: ProductCardProps) {
  return (
    <div
      className="group relative rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[radial-gradient(circle_at_top,var(--accent-soft),transparent_55%),var(--bg-card)] px-5 py-5 shadow-[var(--shadow-soft)] flex flex-col gap-3 hover:border-[var(--accent)] hover:shadow-xl transition-all"
    >
      {/* Thumbnail */}
      {thumbnail && (
        <div style={{ position: "relative" }} className="w-full h-32 mb-2 rounded-lg overflow-hidden border border-[var(--border-subtle)]">
          <Image
            src={thumbnail}
            alt={title}
            fill
            sizes="(min-width:1024px) 25vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-semibold text-[var(--text-main)] line-clamp-2 flex-1">{title}</h3>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
        >
          {isActive ? "Aktiv" : "Inaktiv"}
        </span>
      </div>
      <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-1">{description}</p>
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
        {vendorName && <span>von {vendorName}</span>}
        {createdAt && (
          <span className="ml-auto">Zuletzt aktualisiert: {new Date(createdAt).toLocaleDateString()}</span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[var(--accent)]">
          {(priceCents / 100).toFixed(2)} CHF
        </span>
        <div className="flex gap-2">
          {onEdit && (
            <button
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent-strong)]/40 transition-colors"
              onClick={onEdit}
            >
              Bearbeiten
            </button>
          )}
          {onDelete && (
            <button
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
              onClick={onDelete}
            >
              Löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
