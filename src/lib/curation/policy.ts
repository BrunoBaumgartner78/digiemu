export type Role = "ADMIN" | "VENDOR" | "BUYER";

export type CurationContext = {
  role: Role;
  userId?: string;
};

/**
 * Zentrale Kuratierungsregeln (Single Source of Truth)
 *
 * Ziele:
 * - ADMIN sieht alles
 * - BUYER sieht nur veröffentlichte/approved Produkte von approved Vendors
 * - VENDOR sieht eigene Produkte (auch unapproved), aber öffentlich nur approved
 */
export const CurationPolicy = {
  // Vendor darf öffentlich erst dann verkaufen, wenn approved
  requireVendorApprovedForPublic: true,

  // Produkte müssen approved/published sein, um öffentlich sichtbar zu sein
  requireProductApprovedForPublic: true,

  // Soft-blocks
  hideBlockedUsersEverywhere: true,
  hideBlockedProductsEverywhere: true,
} as const;

export function isAdmin(ctx: CurationContext) {
  return ctx.role === "ADMIN";
}
