import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;

  const body = await _req.json().catch(() => ({}));
  const status = String(body.status ?? "").toUpperCase();
  const isActive = !!body.isActive;

  if (!["ACTIVE", "DRAFT", "BLOCKED"].includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  // Consistency rule: BLOCKED => not active
  const safeIsActive = status === "BLOCKED" ? false : isActive;

  const updated = await prisma.product.update({
    where: { id },
    data: { status: status as any, isActive: safeIsActive },
    select: { id: true, status: true, isActive: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}
