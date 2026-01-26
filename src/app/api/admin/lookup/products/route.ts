import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const take = Math.min(Number(url.searchParams.get("take") ?? 20), 50);

    if (!q) return NextResponse.json({ items: [] });

    const items = await prisma.product.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take,
    });

    return NextResponse.json({
      items: items.map((p) => ({
        id: p.id,
        label: p.title,
      })),
    });
  } catch (e: any) {
    console.error("[api/admin/lookup/products] ERROR", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
