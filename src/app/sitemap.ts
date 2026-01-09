import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://digiemu.ch";

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      isActive: true,
    },
    select: {
      id: true,
      updatedAt: true,
    },
  });

  const productUrls = products.map((p) => ({
    url: `${baseUrl}/product/${p.id}`,
    lastModified: p.updatedAt,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
    },
    ...productUrls,
  ];
}
