
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp, getBooleanProp, getErrorMessage } from "@/lib/guards";
import { Prisma } from "@prisma/client";
import { auditAdminMutation } from "@/lib/admin/audit";

const ALLOWED_ROLES = ["BUYER", "VENDOR", "ADMIN"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];
const VENDOR_ROLE_ROUTE_MESSAGE = "Use vendor approval flow instead: /api/admin/vendors/[id]/status.";

export async function PATCH(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const session = maybe;
  const maybeUser = session.user;
  const adminUserId = maybeUser.id;

  const userId = params.id;
  let bodyUnknown: unknown;
  try {
    bodyUnknown = await _req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updateData: { role?: AllowedRole; isBlocked?: boolean } = {};

  if (isRecord(bodyUnknown)) {
    const role = getStringProp(bodyUnknown, "role");
    const isBlocked = getBooleanProp(bodyUnknown, "isBlocked");

    if (role !== null) {
      if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updateData.role = role as AllowedRole;
    }

    if (isBlocked !== null) {
      updateData.isBlocked = isBlocked;
    }
  }

  // Account status is separate from seller approval.
  // Admin self-protection stays strict: no self-block and no self-demotion out of ADMIN.
  if (
    getStringProp(maybeUser, "id") === userId &&
    (typeof updateData.isBlocked !== "undefined" || updateData.role === "BUYER" || updateData.role === "VENDOR")
  ) {
    return NextResponse.json(
      { error: "You cannot modify your own admin permissions or block yourself." },
      { status: 400 }
    );
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  try {
    let beforeState: { role: AllowedRole | "ADMIN"; isBlocked: boolean } | null = null;
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isBlocked: true },
      });

      if (!current) {
        throw new Error("User not found");
      }
      beforeState = { role: current.role as AllowedRole | "ADMIN", isBlocked: current.isBlocked };

      const directSellerRoleGrant = current.role !== "VENDOR" && updateData.role === "VENDOR";
      const directSellerRoleRevoke = current.role === "VENDOR" && updateData.role === "BUYER";

      // Do not mix account state with vendorProfile.status.
      // Seller rights are canonicalized through /api/admin/vendors/[id]/status.
      if (directSellerRoleGrant || directSellerRoleRevoke) {
        throw new Error(VENDOR_ROLE_ROUTE_MESSAGE);
      }

      const securityRelevantChange =
        (typeof updateData.role !== "undefined" && updateData.role !== current.role) ||
        (typeof updateData.isBlocked !== "undefined" && updateData.isBlocked !== current.isBlocked);

      const nextData: Prisma.UserUpdateInput = {
        ...(updateData as Prisma.UserUpdateInput),
        ...(securityRelevantChange ? { sessionVersion: { increment: 1 } } : {}),
      };

      return tx.user.update({
        where: { id: userId },
        data: nextData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isBlocked: true,
          sessionVersion: true,
          createdAt: true,
        },
      });
    });

    await auditAdminMutation({
      adminUserId,
      action: "ADMIN_USER_UPDATE",
      entityType: "User",
      entityId: updated.id,
      before: beforeState,
      after: {
        role: updated.role,
        isBlocked: updated.isBlocked,
        sessionVersion: updated.sessionVersion,
      },
      request: _req,
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const message = getErrorMessage(e);
    console.error("Admin user update error", message);
    if (message === VENDOR_ROLE_ROUTE_MESSAGE) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
