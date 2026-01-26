// src/app/api/products/[id]/comments/hide/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionApi } from "@/lib/guards/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(status: number, message: string) {
  return NextResponse.json({ message }, { status });
}
function isNextResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: productId } = await ctx.params;

  const s = await requireSessionApi();
  if (isNextResponse(s)) return s;
  const session = s as any;
  const role = session?.user?.role as string | undefined;
  if (role !== "ADMIN") return jsonError(403, "Forbidden");

  const body = await req.json().catch(() => ({} as any));
  const commentId = String(body?.commentId ?? "").trim();
  if (!commentId) return jsonError(400, "Missing commentId");

  // ensure comment belongs to product
  const existing = await prisma.comment.findUnique({ where: { id: commentId }, select: { productId: true } });
  if (!existing) return jsonError(404, "Comment not found");
  if (existing.productId !== productId) return jsonError(400, "Comment does not belong to product");

  const updated = await prisma.comment.update({ where: { id: commentId }, data: { isHidden: true } });

  return NextResponse.json({ ok: true, comment: { id: updated.id, isHidden: updated.isHidden } });
}
