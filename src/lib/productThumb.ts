// src/lib/productThumb.ts
// Fallback-Thumbnail für Produkte (liegt in public/images/)
export const DEFAULT_PRODUCT_THUMB = "/images/product-placeholder.png";

type ProductThumbInput = {
  thumbnailUrl?: string | null;
  imageUrl?: string | null; // optionales alternatives Feld
};

/**
 * Liefert eine sichere Thumbnail-URL:
 * - bevorzugt thumbnailUrl
 * - fallback auf imageUrl
 * - sonst DEFAULT_PRODUCT_THUMB
 * - trim() + optionaler Guard bei undefined
 */
export function getProductThumbUrl(product?: ProductThumbInput) {
  const u = (product?.thumbnailUrl ?? product?.imageUrl ?? "").trim();
  return u.length > 0 ? u : DEFAULT_PRODUCT_THUMB;
}
