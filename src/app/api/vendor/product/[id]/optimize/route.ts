// src/app/api/vendor/product/[id]/optimize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorApi } from "@/lib/guards/authz";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const maybe = await requireVendorApi();
  if (maybe instanceof NextResponse) return maybe;
  const session = maybe;
  const vendorId = session.user.id;
  const { id: productId } = await params;

  // sicherstellen: Produkt gehört diesem Vendor
  const product = await prisma.product.findFirst({
    where: { id: productId, vendorId },
    select: { id: true, title: true, createdAt: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // ✅ Nutze NUR existierende Prisma-Models (bei dir: productView + order)
  const [views, purchases] = await Promise.all([
    prisma.productView.count({ where: { productId } }),
    prisma.order.count({ where: { productId } }),
  ]);

  const conversionRate = views > 0 ? purchases / views : 0;

  // “Optimierungsvorschläge” (simple heuristics)
  const suggestions: string[] = [];
  if (views < 50) suggestions.push("Mehr Traffic: Thumbnail + Titel testen, Produkt in der Startseite/Collections hervorheben.");
  if (views >= 50 && conversionRate < 0.02) suggestions.push("Conversion verbessern: bessere Beschreibung, klare Bullet-Points, Preview-Screenshots, Trust-Elemente.");
  if (conversionRate >= 0.02) suggestions.push("Sieht gut aus: Skalieren mit mehr Views (SEO/Ads/Promos).");

  return NextResponse.json({
    productId: product.id,
    title: product.title,
    stats: {
      views,
      purchases,
      conversionRate,
    },
    suggestions,
  });
}
