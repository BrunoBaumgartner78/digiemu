import { ProductStatus, VendorStatus } from "@/generated/prisma";
import type { ViewerCtx } from "./types";
import { isAdmin, isVendor } from "./types";

/**
 * PUBLIC (Shop / Product Detail / Public Vendor Page):
 * - Product: status=ACTIVE, isActive=true
 * - Vendor user not blocked
 * - VendorProfile exists AND status=APPROVED AND isPublic=true
 *
 * Hinweis: vendorProfileId ist optional im Schema,
 * wir erzwingen für Public Sichtbarkeit, dass vendorProfile vorhanden ist.
 */
export function productWherePublic() {
  return {
    status: ProductStatus.ACTIVE,
    isActive: true,
    vendor: { isBlocked: false },
    vendorProfile: {
      isPublic: true,
      status: VendorStatus.APPROVED,
      user: { isBlocked: false },
    },
  } as const;
}

/**
 * VIEWER:
 * - ADMIN: alles (optional: blocked vendors/users trotzdem anzeigen? hier: ja)
 * - VENDOR: eigene Produkte (DRAFT/ACTIVE/BLOCKED) – aber wenn user blocked -> nix
 * - BUYER: public
 */
export function productWhereForViewer(ctx: ViewerCtx) {
  if (isAdmin(ctx)) return {}; // Admin sieht alles

  if (isVendor(ctx)) {
    return {
      vendorId: ctx.userId!,
      vendor: { isBlocked: false },
    };
  }

  return productWherePublic();
}

/**
 * Vendor public: nur approved + public + user not blocked
 */
export function vendorProfileWherePublic() {
  return {
    isPublic: true,
    status: VendorStatus.APPROVED,
    user: { isBlocked: false },
  } as const;
}

/**
 * Vendor lists im Admin: alle VendorProfile (optional user blocked ausblenden? hier: nein)
 */
export function vendorProfileWhereAdmin() {
  return {};
}
