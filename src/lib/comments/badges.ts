export type CommentBadge = "VERIFIED_BUYER" | "SELLER" | "ADMIN";

export function computeBadges(params: {
  isVerifiedBuyer: boolean;
  isSeller: boolean;
  isAdmin: boolean;
}): CommentBadge[] {
  const out: CommentBadge[] = [];
  if (params.isAdmin) out.push("ADMIN");
  if (params.isSeller) out.push("SELLER");
  if (params.isVerifiedBuyer) out.push("VERIFIED_BUYER");
  return out;
}

export function badgeLabel(b: CommentBadge) {
  switch (b) {
    case "ADMIN":
      return "Admin";
    case "SELLER":
      return "Verkäufer";
    case "VERIFIED_BUYER":
      return "Verifizierter Käufer";
  }
}
