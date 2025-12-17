export type SellerTrustInfo = {
  level: "Starter" | "Creator" | "Pro";
  nextLevelTarget: number;
  progress: number; // 0..1
  badges: string[];
};

export function getSellerTrustInfo(activeProductCount: number): SellerTrustInfo {
  let level: SellerTrustInfo["level"] = "Starter";
  let nextLevelTarget = 5;
  const badges: string[] = [];

  if (activeProductCount >= 20) {
    level = "Pro";
    nextLevelTarget = 100;
    badges.push("Pro");
  } else if (activeProductCount >= 5) {
    level = "Creator";
    nextLevelTarget = 20;
    badges.push("Creator");
  } else {
    level = "Starter";
    nextLevelTarget = 5;
    badges.push("Neu");
  }

  if (activeProductCount > 0) badges.push("Aktiv");
  // Future: if (isTopSeller) badges.push("Top Seller");

  const progress = Math.min(1, activeProductCount / nextLevelTarget);

  return { level, nextLevelTarget, progress, badges };
}
