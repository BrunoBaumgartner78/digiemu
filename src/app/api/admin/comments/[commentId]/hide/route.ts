import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, ctx: { params: Promise<{ commentId: string }> }) {
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = typeof (session?.user as any)?.id === "string" ? ((session?.user as any).id as string) : null;
  const role = (session?.user as any)?.role ?? null;
  if (!userId || role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
