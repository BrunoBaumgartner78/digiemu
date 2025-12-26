export type Badge = { id: string; label: string; tooltip: string };

const BADGE_DEFS: Record<string, Badge> = {
  verified_vendor: { id: "verified_vendor", label: "Verifizierter Verkäufer", tooltip: "Öffentliches Verkäuferprofil mit verifizierter E-Mail" },
  first_sales: { id: "first_sales", label: "Erste Verkäufe", tooltip: "Dieser Verkäufer hat bereits Verkäufe erzielt" },
  trusted_vendor: { id: "trusted_vendor", label: "Zuverlässiger Anbieter", tooltip: "Mindestens 10 Verkäufe ohne Rückerstattungen" },
  fast_delivery: { id: "fast_delivery", label: "Sofort-Download", tooltip: "Digitale Produkte mit sofortigem Zugriff" },
};

/**
 * New contract: vendorProfiles map must contain vendorProfile objects with aggregated counters.
 * Example value: { isPublic: true, totalSales: 5, refundsCount: 0, activeProductsCount: 3 }
 */
export async function getBadgesForVendors(vendorProfiles: Record<string, any>) {
  const result: Record<string, Badge[]> = {};

  const vendorIds = Object.keys(vendorProfiles).filter(Boolean);

  for (const vid of vendorIds) {
    const vp = vendorProfiles[vid] ?? {};

    const totalSales = typeof vp.totalSales === "number" ? vp.totalSales : 0;
    const refunds = typeof vp.refundsCount === "number" ? vp.refundsCount : 0;
    const totalProducts = typeof vp.activeProductsCount === "number" ? vp.activeProductsCount : 0;
    const allDigital = !!vp.allProductsDigital;

    const badges: Badge[] = [];

    if (vp.isPublic === true) badges.push(BADGE_DEFS.verified_vendor);
    if (totalSales >= 1) badges.push(BADGE_DEFS.first_sales);
    if (totalSales >= 10 && refunds === 0) badges.push(BADGE_DEFS.trusted_vendor);
    if (allDigital || (totalProducts > 0 && vp.digitalProductsCount === totalProducts)) badges.push(BADGE_DEFS.fast_delivery);

    result[vid] = badges;
  }

  return result;
}

export function getBadgesFromVendorProfile(vp: any): Badge[] {
  const totalSales = typeof vp?.totalSales === "number" ? vp.totalSales : 0;
  const refunds = typeof vp?.refundsCount === "number" ? vp.refundsCount : 0;
  const totalProducts = typeof vp?.activeProductsCount === "number" ? vp.activeProductsCount : 0;
  const allDigital = !!vp?.allProductsDigital;

  const badges: Badge[] = [];
  if (vp?.isPublic === true) badges.push(BADGE_DEFS.verified_vendor);
  if (totalSales >= 1) badges.push(BADGE_DEFS.first_sales);
  if (totalSales >= 10 && refunds === 0) badges.push(BADGE_DEFS.trusted_vendor);
  if (allDigital || (totalProducts > 0 && vp?.digitalProductsCount === totalProducts)) badges.push(BADGE_DEFS.fast_delivery);

  return badges;
}

export default { getBadgesForVendors, getBadgesFromVendorProfile };
