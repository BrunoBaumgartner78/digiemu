import { prisma } from "@/lib/prisma";

/**
 * Zählt alle Likes für ein Produkt.
 */
export async function getLikeCountForProduct(productId: string): Promise<number> {
  return prisma.like.count({
    where: { productId },
  });
}

/**
 * Prüft, ob ein User ein Produkt bereits geliked hat.
 */
export async function hasUserLikedProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  const like = await prisma.like.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });
  return !!like;
}
