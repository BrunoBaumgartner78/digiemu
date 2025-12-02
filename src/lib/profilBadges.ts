// src/lib/profileBadges.ts

export type ProfileStats = {
  totalSales: number;
  totalDownloads: number;
  memberSince: Date;
  productsPublished: number;
  ratingAverage?: number | null;
};

export type ProfileBadge = {
  id: string;
  label: string;
  description: string;
  color: "blue" | "green" | "purple" | "orange" | "red";
};

export function getProfileBadges(stats: ProfileStats): ProfileBadge[] {
  const badges: ProfileBadge[] = [];

  // Beispiel-Badges, später gern ausbauen:

  // 1. Newcomer / Early
  const monthsActive =
    (new Date().getTime() - stats.memberSince.getTime()) /
    (1000 * 60 * 60 * 24 * 30);

  if (monthsActive < 3) {
    badges.push({
      id: "newcomer",
      label: "Newcomer",
      description: "Neu auf DigiEmu – willkommen in der Community!",
      color: "blue",
    });
  } else if (monthsActive >= 12) {
    badges.push({
      id: "veteran",
      label: "Veteran",
      description: "Seit über einem Jahr aktiv auf DigiEmu.",
      color: "purple",
    });
  }

  // 2. Umsatz-Badges
  if (stats.totalSales > 0 && stats.totalSales < 100) {
    badges.push({
      id: "first-sales",
      label: "Erste Verkäufe",
      description: "Du hast deine ersten Verkäufe erzielt – weiter so!",
      color: "green",
    });
  } else if (stats.totalSales >= 1000) {
    badges.push({
      id: "top-seller",
      label: "Top Seller",
      description: "Über 1000 CHF Umsatz auf DigiEmu.",
      color: "orange",
    });
  }

  // 3. Produkt-Badges
  if (stats.productsPublished >= 10) {
    badges.push({
      id: "creator",
      label: "Product Creator",
      description: "Mehr als 10 Produkte veröffentlicht.",
      color: "blue",
    });
  }

  // 4. Rating-Badge (falls vorhanden)
  if (typeof stats.ratingAverage === "number" && stats.ratingAverage >= 4.5) {
    badges.push({
      id: "community-favorite",
      label: "Community Favorite",
      description: "Durchschnittsbewertung 4.5+ Sterne.",
      color: "green",
    });
  }

  // Fallback: Immer mindestens 1 Badge anzeigen
  if (badges.length === 0) {
    badges.push({
      id: "member",
      label: "Mitglied",
      description: "Aktives Mitglied der DigiEmu-Community.",
      color: "blue",
    });
  }

  return badges;
}
