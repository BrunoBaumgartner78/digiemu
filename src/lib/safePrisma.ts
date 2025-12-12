// src/lib/safePrisma.ts
import { prisma } from "@/lib/prisma";

export async function safeFindProductById(id: string) {
  try {
    if (!id) {
      console.warn("safeFindProductById: keine ID übergeben");
      return null;
    }

    console.log("safeFindProductById: suche Produkt mit ID =", id);

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        // alle Relations, die du brauchst – hier wie bei dir:
        vendor: true,
        vendorProfile: true,
      },
    });

    if (!product) {
      console.warn("safeFindProductById: kein Produkt gefunden für ID =", id);
      return null;
    }

    // Views: deduplizierte Anzahl in den letzten 24h
    const viewsCount = await prisma.productView.count({
      where: {
        productId: id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // alle Produktfelder (+ Thumbnail etc.) + viewsCount zurückgeben
    return { ...product, viewsCount };
  } catch (error) {
    console.error("safeFindProductById Prisma-Fehler:", error);
    return null;
  }
}
