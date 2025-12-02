import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const data = await req.formData();
  const role = data.get("role") as string | undefined;
  const block = data.get("block") as string | undefined;
  const update: Record<string, unknown> = {};
  if (role && ["BUYER", "VENDOR", "ADMIN"].includes(role)) {
    update.role = role;
  }
  if (typeof block === "string") {
    update.isBlocked = block === "true";
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: "No valid action" }, { status: 400 });
  }
  const { id } = await context.params;
  await prisma.user.update({ where: { id }, data: update });
  return NextResponse.json({ ok: true });
}
