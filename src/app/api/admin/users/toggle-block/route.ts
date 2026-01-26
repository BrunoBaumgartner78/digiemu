import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp, getErrorMessage } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const _session = maybe;

  const bodyUnknown = await _req.json().catch(() => null);
  const userId = getStringProp(bodyUnknown, "userId") ?? "";
  if (!userId.trim()) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const _user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, isBlocked: true },
      });

      if (!_user) throw new Error("User not found");

      const nextBlocked = !_user.isBlocked;

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
    console.error("[toggle-block]", getErrorMessage(e));
    return NextResponse.json({ message: getErrorMessage(e) || "Server error" }, { status: 500 });
  }
}

