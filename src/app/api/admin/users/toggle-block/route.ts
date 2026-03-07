import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { getStringProp, getErrorMessage } from "@/lib/guards";
import { auditAdminMutation } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const adminUserId = maybe.user.id;

  const bodyUnknown = await _req.json().catch(() => null);
  const userId = getStringProp(bodyUnknown, "userId") ?? "";
  if (!userId.trim()) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }

  try {
    let beforeState: { isBlocked: boolean } | null = null;
    const updated = await prisma.$transaction(async (tx) => {
      const _user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, isBlocked: true },
      });

      if (!_user) throw new Error("User not found");
      beforeState = { isBlocked: _user.isBlocked };

      const nextBlocked = !_user.isBlocked;

      // 1) User sperren/entsperren
      const u = await tx.user.update({
        where: { id: userId },
        data: { isBlocked: nextBlocked, sessionVersion: { increment: 1 } },
        select: { id: true, isBlocked: true, sessionVersion: true },
      });

      // Blocking a user is an account-level safety measure, not a full moderation rollback.
      if (nextBlocked) {
        // Sperren => Produkte sofort unsichtbar und klar als BLOCKED markiert.
        await tx.product.updateMany({
          where: { vendorId: userId },
          data: { isActive: false, status: "BLOCKED" },
        });
      }

      // Entsperren ändert bewusst keine Produktmoderation. BLOCKED-Produkte bleiben bis zur
      // expliziten fachlichen Prüfung durch Produkt-/Vendor-Moderation unverändert.

      return u;
    });

    await auditAdminMutation({
      adminUserId,
      action: updated.isBlocked ? "ADMIN_USER_BLOCK" : "ADMIN_USER_UNBLOCK",
      entityType: "User",
      entityId: updated.id,
      before: beforeState,
      after: { isBlocked: updated.isBlocked, sessionVersion: updated.sessionVersion },
      request: _req,
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (e: unknown) {
    console.error("[toggle-block]", getErrorMessage(e));
    return NextResponse.json({ message: getErrorMessage(e) || "Server error" }, { status: 500 });
  }
}

