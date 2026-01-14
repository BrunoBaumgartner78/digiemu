export const DEFAULT_PRODUCT_THUMB = "/images/product-placeholder.png"; // liegt in public/images/

export function getProductThumbUrl(product: {
  thumbnailUrl?: string | null;
  imageUrl?: string | null; // falls du noch ein anderes Feld hast
}) {
  const u = (product.thumbnailUrl ?? product.imageUrl ?? "").trim();
  return u.length > 0 ? u : DEFAULT_PRODUCT_THUMB;
}
