// src/app/api/products/[id]/comments/like/route.ts
import { NextResponse, type NextRequest } from "next/server";
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

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id: productId } = await ctx.params;

  const s = await requireSessionApi();
  if (isNextResponse(s)) return s;

  const userId = (s as any)?.user?.id as string | undefined;
  if (!userId) return jsonError(401, "Not authenticated");

  const body = await req.json().catch(() => ({} as any));
  const commentId = String(body?.commentId ?? "").trim();
  if (!commentId) return jsonError(400, "Missing commentId");

  // ✅ sanity: comment belongs to product
  const c = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, productId: true },
  });
  if (!c || c.productId !== productId) return jsonError(404, "Comment not found");

  // ✅ race-safe toggle via composite unique
  let viewerHasLiked = true;

  try {
    // try delete first
    await prisma.commentLike.delete({
      where: { commentId_userId: { commentId, userId } },
    });
    viewerHasLiked = false;
  } catch {
    // if not found -> create
    await prisma.commentLike.create({
      data: { commentId, userId },
    });
    viewerHasLiked = true;
  }

  // ✅ return updated count (1 query)
  const likesCount = await prisma.commentLike.count({ where: { commentId } });

  return NextResponse.json({ likesCount, viewerHasLiked });
}
