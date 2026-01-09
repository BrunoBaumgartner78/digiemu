export function isPublicVendor(v: any) {
  if (!v) return false;
  const approved = String(v.status || "").toUpperCase() === "APPROVED";
  const isPublic = Boolean(v.isPublic);
  return approved && isPublic;
}
