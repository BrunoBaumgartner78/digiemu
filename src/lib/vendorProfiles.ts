export function sellerPublicUrl(vp: { id: string; slug?: string | null }) {
  if (!vp) return "/seller/";
  const slug = typeof vp.slug === "string" ? vp.slug.trim() : "";
  if (slug.length > 0) return `/profile/${encodeURIComponent(slug)}`;
  return `/seller/${encodeURIComponent(String(vp.id))}`;
}

export default sellerPublicUrl;
