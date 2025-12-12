import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendorId = session.user.id;
  const { id: productId } = await context.params;

  // Ensure vendor owns product
  const product = await prisma.product.findFirst({
    where: { id: productId, vendorId },
  });

  if (!product) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  // Fetch stats (⚠️ passe die Model-Namen an, falls sie bei dir anders heißen)
  const impressions = await prisma.impressions.count({ where: { productId } });
  const views = await prisma.productViews.count({ where: { productId } });
  const purchases = await prisma.orders.count({ where: { productId } });

  const viewRate = impressions > 0 ? views / impressions : 0;
  const purchaseRate = views > 0 ? purchases / views : 0;

  const prompt = `
Du bist ein Daten- und Marketing-Experte für digitale Marktplätze.
Analysiere folgendes Produkt und gib Optimierungsvorschläge zurück.

Produktdaten:
Titel: ${product.title}
Beschreibung: ${product.description}
Kategorie: ${product.category}
Preis (CHF): ${(product.priceCents / 100).toFixed(2)}

Performance:
Impressions: ${impressions}
Views: ${views}
Purchases: ${purchases}

Conversion:
View-Rate: ${(viewRate * 100).toFixed(1)}%
Purchase-Rate: ${(purchaseRate * 100).toFixed(1)}%

Gib ein JSON zurück mit:
{
  "seo_score": 0-100,
  "seo_issues": [],
  "seo_suggestions": [],
  "pricing_score": 0-100,
  "pricing_suggestions": [],
  "conversion_score": 0-100,
  "conversion_suggestions": [],
  "keyword_list": [],
  "summary": ""
}
  `.trim();

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "Du bist ein professioneller Marketplace-Optimierungsassistent.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    const json = await aiRes.json();

    const content = json.choices?.[0]?.message?.content ?? "{}";
    let data: any = {};
    try {
      data = JSON.parse(content);
    } catch {
      // falls die AI kein reines JSON liefert, wenigstens raw zurückgeben
      data = { raw: content };
    }

    return NextResponse.json({ analysis: data });
  } catch (err) {
    console.error("AI optimization error:", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
