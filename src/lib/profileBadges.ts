export type ProfileStatsInput = {
  productCount: number;
};

export type ProfileBadgesResult = {
  level: string;
  badges: string[];
};

export function getProfileBadges(
  { productCount }: ProfileStatsInput
): ProfileBadgesResult {
  const badges: string[] = [];

  if (productCount === 0) {
    badges.push("Neuer Verkäufer");
    return { level: "Starter", badges };
  }

  if (productCount > 0 && productCount < 5) {
    badges.push("Aktiver Verkäufer");
    return { level: "New Seller", badges };
  }

  if (productCount >= 5 && productCount < 20) {
    badges.push("Wachsender Katalog");
    badges.push("Rising Seller");
    return { level: "Rising Seller", badges };
  }

  if (productCount >= 20 && productCount < 100) {
    badges.push("Pro-Verkäufer");
    badges.push("Community-Pillar");
    return { level: "Pro Seller", badges };
  }

  badges.push("Top-Verkäufer");
  badges.push("Community-Legend");
  return { level: "Legend", badges };
}
