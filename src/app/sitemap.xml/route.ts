import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isCi = () => process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

function baseUrl() {
  return (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function xml(urls: string[]) {
  const body = urls.map((u) => `<url><loc>${u}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export async function GET() {
  if (isCi()) {
    const urls = [baseUrl() + "/"];
    return new NextResponse(xml(urls), {
      status: 200,
      headers: { "content-type": "application/xml; charset=utf-8" },
    });
  }

  try {
    const products = await prisma.product.findMany({
      select: { id: true, updatedAt: true },
      where: { status: "PUBLISHED" as any },
    });

    const urls = [baseUrl() + "/", ...products.map((p) => `${baseUrl()}/product/${p.id}`)];

    return new NextResponse(xml(urls), {
      status: 200,
      headers: { "content-type": "application/xml; charset=utf-8" },
    });
  } catch {
    const urls = [baseUrl() + "/"];
    return new NextResponse(xml(urls), {
      status: 200,
      headers: { "content-type": "application/xml; charset=utf-8" },
    });
  }
}
