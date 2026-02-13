// src/app/api/products/[id]/comments/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Role, Prisma } from "@prisma/client";
import { requireSessionApi } from "@/lib/guards/authz";
import { computeBadges } from "@/lib/comments/badges";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function jsonError(status: number, message: string) {
  return NextResponse.json({ message }, { status });
}

function isNextResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}

function parseTake(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("take");
  const n = raw ? Number(raw) : 20;
  if (!Number.isFinite(n) || n <= 0) return 20;
  return Math.min(50, Math.max(1, Math.floor(n)));
}

function parseSort(req: NextRequest): "new" | "top" {
  const s = (req.nextUrl.searchParams.get("sort") ?? "new").toLowerCase();
  return s === "top" ? "top" : "new";
}

function isRole(x: unknown): x is Role {
  return x === "ADMIN" || x === "VENDOR" || x === "BUYER";
}

function getSessionUser(session: unknown): { id?: string; role?: Role } {
  const s = session as { user?: { id?: unknown; role?: unknown } } | null;
  const id = typeof s?.user?.id === "string" ? s.user.id : undefined;

  const rawRole = s?.user?.role;
  const role = isRole(rawRole) ? rawRole : undefined;

  return { id, role };
}

type UiItem = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: { id: string; name: string | null; role: Role | null };
  badges: string[];
  likesCount: number;
  viewerHasLiked: boolean;
};

type UserMini = { id: string; name: string | null; role: Role | null };

type CommentRow = Prisma.CommentGetPayload<{
  select: { id: true; content: true; createdAt: true; userId: true };
}>;

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id: productId } = await ctx.params;
  const sort = parseSort(req);
  const take = parseTake(req);

  // viewer optional
  let viewerUserId: string | null = null;
  let viewerRole: Role | null = null;

  try {
    const s = await requireSessionApi();
    if (s && !isNextResponse(s)) {
      const u = getSessionUser(s);
      if (u.id) viewerUserId = u.id;
      if (u.role) viewerRole = u.role;
    }
  } catch {
    // ignore
  }

  // seller user id (for badge)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      vendorId: true,
      vendorProfile: { select: { userId: true } },
    },
  });
  if (!product) return jsonError(404, "Not found");
  const sellerUserId = product.vendorProfile?.userId ?? product.vendorId ?? null;

  // verified buyers set (for badge)
  const buyers = await prisma.order.findMany({
    where: { productId, status: "PAID" },
    select: { buyerId: true },
    distinct: ["buyerId"],
  });
  const verifiedBuyerSet = new Set(
    buyers
      .map((b) => b.buyerId)
      .filter((x): x is string => typeof x === "string" && x.length > 0)
  );

  // load comments
  const whereBase: Prisma.CommentWhereInput = { productId };
  if (viewerRole !== "ADMIN") whereBase.isHidden = false;

  const rawComments: CommentRow[] = await prisma.comment.findMany({
    where: whereBase,
    take: Math.max(take, 50),
    select: { id: true, content: true, createdAt: true, userId: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const commentIds = rawComments.map((c) => c.id);
  const userIds = Array.from(
    new Set(
      rawComments
        .map((c) => c.userId)
        .filter((x): x is string => typeof x === "string" && x.length > 0)
    )
  );

  // load users (no Comment->User relation required)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, role: true },
  });

  const userById = new Map<string, UserMini>();
  for (const u of users) {
    userById.set(u.id, { id: u.id, name: u.name ?? null, role: u.role ?? null });
  }

  // likes counts + viewer likes via CommentLike (optional model)
  const commentLikeClient = (prisma as unknown as { commentLike?: any }).commentLike;

  const likesCountByCommentId = new Map<string, number>();
  const viewerLikedSet = new Set<string>();

  if (commentLikeClient && commentIds.length > 0) {
    const grouped: Array<{ commentId: string; _count: { _all: number } }> =
      await commentLikeClient.groupBy({
        by: ["commentId"],
        where: { commentId: { in: commentIds } },
        _count: { _all: true },
      });

    for (const g of grouped) likesCountByCommentId.set(g.commentId, g._count._all);

    if (viewerUserId) {
      const liked: Array<{ commentId: string }> = await commentLikeClient.findMany({
        where: { userId: viewerUserId, commentId: { in: commentIds } },
        select: { commentId: true },
      });
      for (const x of liked) viewerLikedSet.add(x.commentId);
    }
  }

  // build items
  let items: UiItem[] = rawComments.map((c) => {
    const u = userById.get(c.userId);
    const role = u?.role ?? null;

    const isAdmin = role === "ADMIN";
    const isSeller = !!sellerUserId && c.userId === sellerUserId;
    const isVerifiedBuyer = verifiedBuyerSet.has(c.userId);

    const badges = computeBadges({ isAdmin, isSeller, isVerifiedBuyer });

    const likesCount = likesCountByCommentId.get(c.id) ?? 0;
    const viewerHasLiked = viewerUserId ? viewerLikedSet.has(c.id) : false;

    return {
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      userId: c.userId,
      user: { id: c.userId, name: u?.name ?? null, role },
      badges,
      likesCount,
      viewerHasLiked,
    };
  });

  // sort
  if (sort === "top") {
    items = items
      .slice()
      .sort((a, b) => {
        if (b.likesCount !== a.likesCount) return b.likesCount - a.likesCount;
        if (b.createdAt !== a.createdAt) return b.createdAt.localeCompare(a.createdAt);
        return b.id.localeCompare(a.id);
      })
      .slice(0, take);
  } else {
    items = items.slice(0, take);
  }

  const count = await prisma.comment.count({ where: whereBase });

  return NextResponse.json({ items, count });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id: productId } = await ctx.params;

  const s = await requireSessionApi();
  if (isNextResponse(s)) return s;

  const { id: userId, role: sessionRole } = getSessionUser(s);
  if (!userId) return jsonError(401, "Not authenticated");

  const body = (await req.json().catch(() => ({}))) as unknown;
  const b = body as Record<string, unknown>;
  const text = String(b?.text ?? b?.content ?? "").trim();
  if (!text) return jsonError(400, "Missing text");

  // seller user id (for badge)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      vendorId: true,
      vendorProfile: { select: { userId: true } },
    },
  });
  if (!product) return jsonError(404, "Not found");
  const sellerUserId = product.vendorProfile?.userId ?? product.vendorId ?? null;

  // verified buyers set (for badge)
  const buyers = await prisma.order.findMany({
    where: { productId, status: "PAID" },
    select: { buyerId: true },
    distinct: ["buyerId"],
  });
  const verifiedBuyerSet = new Set(
    buyers
      .map((b) => b.buyerId)
      .filter((x): x is string => typeof x === "string" && x.length > 0)
  );

  // create comment
  const created = await prisma.comment.create({
    data: { productId, userId, content: text },
    select: { id: true, content: true, createdAt: true, userId: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  });

  const effectiveRole: Role | null = user?.role ?? sessionRole ?? null;

  const isAdmin = effectiveRole === "ADMIN";
  const isSeller = !!sellerUserId && created.userId === sellerUserId;
  const isVerifiedBuyer = verifiedBuyerSet.has(created.userId);

  const badges = computeBadges({ isAdmin, isSeller, isVerifiedBuyer });

  return NextResponse.json({
    comment: {
      id: created.id,
      content: created.content,
      createdAt: created.createdAt.toISOString(),
      userId: created.userId,
      user: { id: created.userId, name: user?.name ?? null, role: user?.role ?? null },
      badges,
      likesCount: 0,
      viewerHasLiked: false,
    },
  });
}
