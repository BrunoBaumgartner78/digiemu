
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["BUYER", "VENDOR", "ADMIN"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = params.id;
  let body: { role?: string; isBlocked?: boolean };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updateData: any = {};

  if (typeof body.role !== "undefined") {
    if (!ALLOWED_ROLES.includes(body.role as AllowedRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    updateData.role = body.role;
  }

  if (typeof body.isBlocked !== "undefined") {
    if (typeof body.isBlocked !== "boolean") {
      return NextResponse.json({ error: "isBlocked must be boolean" }, { status: 400 });
    }
    updateData.isBlocked = body.isBlocked;
  }

  // Optional: Admin-Selbstschutz
  if (
    session.user.id === userId &&
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
      data: updateData,
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
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
