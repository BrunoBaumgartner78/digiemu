import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://bellu.ch";

  // 🟢 CI fallback – verhindert Build Crash
  if (process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true") {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
      },
      {
        url: `${baseUrl}/marketplace`,
        lastModified: new Date(),
      },
    ];
  }

  try {
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
  } catch (error) {
    console.error("Sitemap fallback (DB unavailable):", error);

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
      },
      {
        url: `${baseUrl}/marketplace`,
        lastModified: new Date(),
      },
    ];
  }
}
