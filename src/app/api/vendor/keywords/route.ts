import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STOP_WORDS = [
  "der","die","das","und","oder","mit","für","ein","eine","von","in","im",
  "auf","zu","zum","zur","den","dem","des","einfach","sehr","mehr","weniger"
];

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,;:!?()]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.includes(w))
    .slice(0, 50);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendorId = session.user.id;

  const products = await prisma.product.findMany({
    where: { vendorId },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const keywordMap = new Map<string, { count: number; products: string[] }>();

  for (const p of products) {
    const text = `${p.title ?? ""} ${p.description ?? ""} ${p.category ?? ""}`;
    const kws = extractKeywords(text);

    for (const kw of kws) {
      const entry = keywordMap.get(kw) ?? { count: 0, products: [] };
      entry.count += 1;
      if (!entry.products.includes(p.id)) entry.products.push(p.id);
      keywordMap.set(kw, entry);
    }
  }

  const keywords = [...keywordMap.entries()]
    .map(([keyword, data]) => ({
      keyword,
      count: data.count,
      productCount: data.products.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  return NextResponse.json({ keywords });
}
