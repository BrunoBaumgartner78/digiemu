import { prisma } from "@/lib/prisma";

export type SellerTrustInfo = {
  level: "Starter" | "Creator" | "Pro" | "Elite";
  nextLevelTarget: number; // number of products OR CHF amount depending on unit
  nextLevelUnit: "products" | "chf";
  progress: number; // 0..1
  badges: string[];
};

type SellerTrustInput = {
  activeProductCount: number;
  totalSalesCount: number;
  totalRevenueCents: number;
  profileComplete: boolean;
};

export function getSellerTrustInfo(input: SellerTrustInput): SellerTrustInfo {
  const { activeProductCount, totalRevenueCents } = input;
  const badges: string[] = [];

  // Rules:
  // - Starter: products_min 0
  // - Creator: products_min 5
  // - Pro: products_min 20
  // - Elite: revenue_min_chf 10000

  const ELITE_REVENUE_CHF = 10000;
  const ELITE_REVENUE_CENTS = ELITE_REVENUE_CHF * 100;

  let level: SellerTrustInfo["level"] = "Starter";
  let nextLevelTarget = 5;
  let nextLevelUnit: SellerTrustInfo["nextLevelUnit"] = "products";

  if (input.totalRevenueCents >= ELITE_REVENUE_CENTS) {
    level = "Elite";
    // Elite is top - no next target, show full progress
    nextLevelTarget = ELITE_REVENUE_CHF;
    nextLevelUnit = "chf";
    badges.push("Elite");
  } else if (activeProductCount >= 20) {
    level = "Pro";
    // Next level is Elite (revenue)
    nextLevelTarget = ELITE_REVENUE_CHF;
    nextLevelUnit = "chf";
    badges.push("Pro");
  } else if (activeProductCount >= 5) {
    level = "Creator";
    nextLevelTarget = 20;
    nextLevelUnit = "products";
    badges.push("Creator");
  } else {
    level = "Starter";
    nextLevelTarget = 5;
    nextLevelUnit = "products";
    badges.push("Neu");
  }

  if (activeProductCount > 0) badges.push("Aktiv");

  // Progress: if next unit is products -> use activeProductCount / nextLevelTarget
  // if next unit is chf -> use totalRevenueCents / (nextLevelTarget * 100)
  let progress = 0;
  if (nextLevelUnit === "products") {
    progress = Math.min(1, input.activeProductCount / Math.max(1, nextLevelTarget));
  } else {
    progress = Math.min(1, input.totalRevenueCents / (nextLevelTarget * 100));
  }

  return { level, nextLevelTarget, nextLevelUnit, progress, badges };
}

// Helper: fetches counts from DB and returns SellerTrustInfo
export async function computeSellerTrustFromDb(userId: string): Promise<SellerTrustInfo> {
  // active products: use Product.status === 'ACTIVE' or isActive
  const activeProductCount = await prisma.product.count({
    where: {
      vendorId: userId,
      OR: [{ status: "ACTIVE" }, { isActive: true }],
    },
  });

  // orders for vendor products
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["PAID", "COMPLETED"] },
      product: { vendorId: userId },
    },
    select: { vendorEarningsCents: true, amountCents: true },
  });

  const totalSalesCount = orders.length;
  const totalRevenueCents = orders.reduce((sum, o) => {
    const v = typeof o.vendorEarningsCents === "number" ? o.vendorEarningsCents : 0;
    const fallback = typeof o.amountCents === "number" ? o.amountCents : 0;
    return sum + (v > 0 ? v : fallback);
  }, 0);

  // profile complete heuristic
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  const profileComplete = Boolean(vendorProfile && vendorProfile.displayName && vendorProfile.avatarUrl);

  return getSellerTrustInfo({ activeProductCount, totalSalesCount, totalRevenueCents, profileComplete });
}
