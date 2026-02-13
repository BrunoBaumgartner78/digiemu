// src/app/api/products/[id]/comments/like/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOptionalSessionApi, requireSessionApi } from "@/lib/guards/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function jsonError(status: number, message: string) {
  return NextResponse.json({ message }, { status });
}
function isNextResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}
function getUserIdFromSession(s: unknown): string | undefined {
  const session = s as { user?: { id?: unknown } } | null;
  return typeof session?.user?.id === "string" ? session.user.id : undefined;
}

// GET = likesCount + viewerHasLiked (commentId via query ?commentId=...)
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id: productId } = await ctx.params;

  const commentId = (req.nextUrl.searchParams.get("commentId") ?? "").trim();
  if (!commentId) return jsonError(400, "Missing commentId");

  // sanity: comment belongs to product
  const c = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, productId: true },
  });
  if (!c || c.productId !== productId) return jsonError(404, "Comment not found");

  const session = await getOptionalSessionApi().catch(() => null);
  const userId = getUserIdFromSession(session);

  const [likesCount, viewerHasLiked] = await Promise.all([
    prisma.commentLike.count({ where: { commentId } }),
    userId
      ? prisma.commentLike
          .findUnique({ where: { commentId_userId: { commentId, userId } }, select: { commentId: true } })
          .then(Boolean)
      : Promise.resolve(false),
  ]);

  return NextResponse.json({ likesCount, viewerHasLiked });
}

// POST = toggle (commentId in body)
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id: productId } = await ctx.params;

  const s = await requireSessionApi();
  if (isNextResponse(s)) return s;

  const userId = getUserIdFromSession(s);
  if (!userId) return jsonError(401, "Not authenticated");

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const commentId = String(body?.commentId ?? "").trim();
  if (!commentId) return jsonError(400, "Missing commentId");

  // sanity: comment belongs to product
  const c = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, productId: true },
  });
  if (!c || c.productId !== productId) return jsonError(404, "Comment not found");

  // toggle
  let viewerHasLiked = true;
  try {
    await prisma.commentLike.delete({
      where: { commentId_userId: { commentId, userId } },
    });
    viewerHasLiked = false;
  } catch {
    await prisma.commentLike.create({
      data: { commentId, userId },
    });
    viewerHasLiked = true;
  }

  const likesCount = await prisma.commentLike.count({ where: { commentId } });

  return NextResponse.json({ likesCount, viewerHasLiked });
}
