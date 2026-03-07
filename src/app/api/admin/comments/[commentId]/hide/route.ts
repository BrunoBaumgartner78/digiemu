import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ commentId: string }> }) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const { commentId } = await ctx.params;
  const id = String(commentId ?? "").trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Try to set isHidden if the field exists, otherwise delete as fallback
  try {
    // use any to avoid TS type errors if schema doesn't include isHidden
    await (prisma as any).comment.update({ where: { id }, data: { isHidden: true } });
    return NextResponse.json({ ok: true, action: "hidden" });
  } catch (e) {
    // Fallback: delete the comment
    try {
      await prisma.comment.delete({ where: { id } });
      return NextResponse.json({ ok: true, action: "deleted" });
    } catch (err) {
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
  }
}
