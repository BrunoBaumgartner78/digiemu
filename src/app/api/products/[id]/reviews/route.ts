import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionApi } from "@/lib/guards/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function jsonError(status: number, message: string) {
  return NextResponse.json({ message }, { status });
}

function isNextResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}

// GET: list reviews (public)
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id: productId } = await ctx.params;
  if (!productId) return jsonError(400, "Missing product id");

  const p = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!p) return jsonError(404, "Not found");

  const items = await prisma.review.findMany({
    where: { productId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      rating: true,
      content: true,
      createdAt: true,
      userId: true,
      user: { select: { id: true, name: true } },
    },
    take: 50,
  });

  const avg =
    items.length > 0
      ? Math.round((items.reduce((s, r) => s + (r.rating ?? 0), 0) / items.length) * 10) / 10
      : null;

  return NextResponse.json({
    items: items.map((r) => ({
      id: r.id,
      rating: r.rating,
      content: r.content ?? null,
      createdAt: r.createdAt.toISOString(),
      userId: r.userId,
      user: { id: r.user?.id ?? r.userId, name: r.user?.name ?? null },
    })),
    count: items.length,
    averageRating: avg,
  });
}

// POST: upsert user's review (requires session)
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id: productId } = await ctx.params;
  if (!productId) return jsonError(400, "Missing product id");

  const s = await requireSessionApi();
  if (isNextResponse(s)) return s;
  const session = s as any;
  const userId = session?.user?.id as string | undefined;
  if (!userId) return jsonError(401, "Not authenticated");

  const body = await req.json().catch(() => ({} as any));
  const rating = Number(body?.rating);
  const content = typeof body?.content === "string" ? body.content.trim() : null;

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return jsonError(400, "Invalid rating (1-5)");
  }

  const p = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!p) return jsonError(404, "Not found");

  const upserted = await prisma.review.upsert({
    where: { userId_productId: { userId, productId } },
    update: { rating, content },
    create: { userId, productId, rating, content },
    select: {
      id: true,
      rating: true,
      content: true,
      createdAt: true,
      userId: true,
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    review: {
      id: upserted.id,
      rating: upserted.rating,
      content: upserted.content ?? null,
      createdAt: upserted.createdAt.toISOString(),
      userId: upserted.userId,
      user: { id: upserted.user?.id ?? upserted.userId, name: upserted.user?.name ?? null },
    },
  });
}
