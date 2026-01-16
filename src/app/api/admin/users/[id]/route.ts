
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp, getBooleanProp } from "@/lib/guards";
import { Prisma } from "@prisma/client";

const ALLOWED_ROLES = ["BUYER", "VENDOR", "ADMIN"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export async function PATCH(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const session = await getServerSession(authOptions);

  const maybeUser = session?.user;
  if (!isRecord(maybeUser) || getStringProp(maybeUser, "role") !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  // Optional: Admin-Selbstschutz
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
    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData as Prisma.UserUpdateInput,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Admin user update error", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
