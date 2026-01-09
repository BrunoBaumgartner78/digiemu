export function isPublishedProduct(p: any) {
  if (!p) return false;
  return String(p.status || "").toUpperCase() === "PUBLISHED";
}
