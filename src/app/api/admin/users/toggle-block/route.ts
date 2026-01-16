import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp, getErrorMessage } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const session = await getServerSession(auth);
  const maybeUser = session?.user;
  if (!isRecord(maybeUser) || getStringProp(maybeUser, "role") !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const bodyUnknown = await _req.json().catch(() => null);
  const userId = getStringProp(bodyUnknown, "userId") ?? "";
  if (!userId.trim()) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }
  if (!userId) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, isBlocked: true },
      });

      if (!user) throw new Error("User not found");

      const nextBlocked = !user.isBlocked;

      // 1) User sperren/entsperren
      const u = await tx.user.update({
        where: { id: userId },
        data: { isBlocked: nextBlocked },
        select: { id: true, isBlocked: true },
      });

      // 2) Produkte moderieren
      if (nextBlocked) {
        // Sperren => Produkte sofort unsichtbar
        await tx.product.updateMany({
          where: { vendorId: userId },
          data: { isActive: false, status: "BLOCKED" },
        });
      } else {
        // Entsperren => Produkte wieder sichtbar machen,
        // aber nur die, die durch Sperre BLOCKED wurden:
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
  } catch (e: unknown) {
    console.error("[toggle-block]", e);
    return NextResponse.json({ message: getErrorMessage(e) || "Server error" }, { status: 500 });
  }
}
