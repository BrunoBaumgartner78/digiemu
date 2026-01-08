import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(auth);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const userId = String(body?.userId ?? "").trim();
  if (!userId) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }
  // HARD GUARD #1: cannot target self
  if ((session.user as any)?.id === userId) {
    return NextResponse.json({ message: "You cannot block/unblock yourself" }, { status: 400 });
  }

  try {
    // fetch target user and role first (server-side guard)
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isBlocked: true, role: true },
    });

    if (!target) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // HARD GUARD #2: forbid blocking ADMIN users
    if (target.role === "ADMIN") {
      return NextResponse.json({ message: "Blocking ADMIN users is forbidden" }, { status: 403 });
    }

    const nextBlocked = !target.isBlocked;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { isBlocked: nextBlocked },
        select: { id: true, isBlocked: true },
      });

      if (nextBlocked) {
        await tx.product.updateMany({
          where: { vendorId: userId },
          data: { isActive: false, status: "BLOCKED" },
        });
      } else {
        await tx.product.updateMany({
          where: {
            vendorId: userId,
            status: "BLOCKED",
          },
          data: { isActive: true, status: "ACTIVE" },
        });
      }

      return u;
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (e: any) {
    console.error("[toggle-block]", e);
    return NextResponse.json(
      { message: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
