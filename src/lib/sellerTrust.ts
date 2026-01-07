// src/lib/sellerTrust.ts
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant-context";

export type SellerTrustInfo = {
  level: string;
  nextLevelTarget: number;
  nextLevelUnit: "sales" | "revenue" | "products" | "profile";
};

function getSellerTrustInfo(input: {
  activeProductCount: number;
  totalSalesCount: number;
  totalRevenueCents: number;
  profileComplete: boolean;
}): SellerTrustInfo {
  const { activeProductCount, totalSalesCount, totalRevenueCents, profileComplete } = input;

  if (!profileComplete) return { level: "Starter", nextLevelTarget: 1, nextLevelUnit: "profile" };
  if (totalSalesCount < 5) return { level: "Starter", nextLevelTarget: 5, nextLevelUnit: "sales" };
  if (totalRevenueCents < 50_00) return { level: "Trusted", nextLevelTarget: 50, nextLevelUnit: "revenue" };
  if (activeProductCount < 10) return { level: "Pro", nextLevelTarget: 10, nextLevelUnit: "products" };
  return { level: "Elite", nextLevelTarget: 0, nextLevelUnit: "sales" };
}

/**
 * Tenant-safe Trust berechnen:
 * - tenantKey aus currentTenant()
 * - VendorProfile über @@unique([tenantKey, userId]) → tenantKey_userId
 */
export async function computeSellerTrustFromDb(userId: string): Promise<SellerTrustInfo> {
  const { key: tenantKey } = await currentTenant();

  const [activeProductCount, salesAgg, vendorProfile] = await Promise.all([
    prisma.product.count({
      where: {
        tenantKey,
        vendorId: userId,
        isActive: true,
        status: "ACTIVE",
      },
    }),

    prisma.order.aggregate({
      where: {
        tenantKey,
        product: { vendorId: userId },
        // optional: nur PAID zählen:
        // status: "PAID",
      },
      _count: { _all: true },
      _sum: { vendorEarningsCents: true },
    }),

    prisma.vendorProfile.findUnique({
      where: {
        tenantKey_userId: { tenantKey, userId },
      },
      select: { displayName: true, avatarUrl: true },
    }),
  ]);

  const totalSalesCount = salesAgg._count?._all ?? 0;
  const totalRevenueCents = salesAgg._sum?.vendorEarningsCents ?? 0;

  const profileComplete = Boolean(
    (vendorProfile?.displayName ?? "").trim() && (vendorProfile?.avatarUrl ?? "").trim()
  );

  return getSellerTrustInfo({
    activeProductCount,
    totalSalesCount,
    totalRevenueCents,
    profileComplete,
  });
}
