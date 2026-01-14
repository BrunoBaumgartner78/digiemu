// src/lib/marketplace-visibility.ts
// Single source of truth for marketplace product visibility.
// IMPORTANT: Keep logic in sync with DB query below.
export type VisibilityDebug = { isVisible: boolean; reasons: string[] };

export function getMarketplaceVisibilityDebug(p: any): VisibilityDebug {
  const reasons: string[] = [];
  if (!p) return { isVisible: false, reasons: ["no-product"] };

  // Product gates
  if (p.status !== "ACTIVE") reasons.push("product.status!=ACTIVE");
  if (p.isActive !== true) reasons.push("product.isActive!=true");

  // Vendor gates
  const vendorBlocked = p?.vendor?.isBlocked === true;
  if (vendorBlocked) reasons.push("vendor.isBlocked=true");

  // VendorProfile gates (optional, depending on your rules)
  const vpStatus = p?.vendorProfile?.status ?? null;
  const vpPublic = p?.vendorProfile?.isPublic === true;

  if (!p.vendorProfile) reasons.push("vendorProfile missing");
  else {
    if (!vpPublic) reasons.push("vendorProfile.isPublic!=true");
    if (vpStatus !== "APPROVED") reasons.push(`vendorProfile.status=${vpStatus ?? "NULL"}`);
  }

  return { isVisible: reasons.length === 0, reasons };
}

export function marketplaceWhereClause() {
  // Mirror the debug logic in Prisma where-clause.
  // Adjust if your schema differs.
  return {
    status: "ACTIVE",
    isActive: true,
    vendor: { isBlocked: false },
    vendorProfile: {
      is: {
        status: "APPROVED",
        isPublic: true,
      },
    },
  } as const;
}

