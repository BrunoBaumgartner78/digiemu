import { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp, getErrorMessage } from "@/lib/guards";
import type { Role, VendorStatus } from "@prisma/client";
import { ok, bad, unauth, fail } from "@/lib/api/adminResponse";
import { auditAdminMutation } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["PENDING", "APPROVED", "BLOCKED"]);

function roleForVendorStatus(currentRole: Role, nextStatus: VendorStatus): Role {
  if (currentRole === "ADMIN") return currentRole;
  return nextStatus === "APPROVED" ? "VENDOR" : "BUYER";
}

// canonical vendor approval endpoint
//
// Fachliche Entscheidung: VendorProfile.status steuert nur Seller-Rechte.
// Ein globaler Account-Block lebt ausschliesslich auf user.isBlocked und wird
// ueber die User-Admin-Flows verwaltet, nicht ueber Vendor-Moderation.
//
// Daraus folgt:
// - APPROVED => Seller freigeschaltet, Rolle VENDOR (Admin bleibt Admin)
// - PENDING  => Seller noch/nicht freigeschaltet, keine aktive Seller-Rolle
// - BLOCKED  => Seller-Funktion entzogen, aber kein impliziter globaler Account-Block
//
// Wenn ein Account bereits global blockiert ist, bleibt dieser Block hier bewusst
// unveraendert. Vendor-Status und globaler Security-Block muessen getrennt bleiben.
// Vendor role is granted through seller approval flow.

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return unauth();
  const adminUserId = auth.user.id;

  const { id } = await context.params;
  const raw = await req.json().catch(() => ({} as unknown));
  const nextStatus = (isRecord(raw) ? (getStringProp(raw, "status") ?? "") : "").toUpperCase().trim();
  const hasModerationNote = isRecord(raw) && Object.prototype.hasOwnProperty.call(raw, "moderationNote");
  const moderationNote = hasModerationNote ? (getStringProp(raw, "moderationNote") ?? null) : undefined;

  if (!id) return bad("Missing id", 400);
  if (!ALLOWED.has(nextStatus)) return bad("Invalid status. Use PENDING | APPROVED | BLOCKED.", 400);

  try {
    let beforeState:
      | {
          vendorStatus: VendorStatus;
          role: Role;
          isBlocked: boolean;
          moderationNote?: string | null;
        }
      | null = null;
    const result = await prisma.$transaction(async (tx) => {
      const vp = await tx.vendorProfile.findUnique({ where: { userId: id }, select: { id: true, status: true } });
      if (!vp) throw new Error("VendorProfile not found");

      const user = await tx.user.findUnique({
        where: { id },
        select: { role: true, isBlocked: true },
      });
      if (!user) throw new Error("User not found");
      const currentVendorProfile = await tx.vendorProfile.findUnique({
        where: { userId: id },
        select: { moderationNote: true },
      });
      beforeState = {
        vendorStatus: vp.status,
        role: user.role,
        isBlocked: user.isBlocked,
        moderationNote: currentVendorProfile?.moderationNote ?? null,
      };

      const nextVendorStatus = nextStatus as VendorStatus;
      const nextRole = roleForVendorStatus(user.role, nextVendorStatus);
      const statusChanged = vp.status !== nextVendorStatus;
      const roleChanged = nextRole !== user.role;

      const updatedVP = await tx.vendorProfile.update({
        where: { id: vp.id },
        data: {
          status: nextVendorStatus,
          ...(hasModerationNote ? { moderationNote } : {}),
        },
        select: { id: true, status: true, moderationNote: true },
      });

      if (roleChanged) {
        await tx.user.update({
          where: { id },
          data: { role: nextRole },
        });
      }

      if (statusChanged || roleChanged) {
        await tx.user.update({ where: { id }, data: { sessionVersion: { increment: 1 } } });
      }

      return {
        vendorProfile: updatedVP,
        vendorId: id,
        userId: id,
        role: nextRole,
        accountBlocked: user.isBlocked,
      };
    });

    await auditAdminMutation({
      adminUserId,
      action: "ADMIN_VENDOR_SET_STATUS",
      entityType: "VendorProfile",
      entityId: result.vendorProfile.id,
      before: beforeState,
      after: {
        vendorStatus: result.vendorProfile.status,
        role: result.role,
        accountBlocked: result.accountBlocked,
        moderationNote: result.vendorProfile.moderationNote,
      },
      note: moderationNote,
      request: req,
    });

    return ok({
      ok: true,
      vendorId: result.vendorId,
      userId: result.userId,
      vendorStatus: result.vendorProfile.status,
      role: result.role,
      accountBlocked: result.accountBlocked,
      moderationNote: result.vendorProfile.moderationNote,
    });
  } catch (e: unknown) {
    console.error("[admin/vendors/status]", e);
    return fail(getErrorMessage(e));
  }
}
