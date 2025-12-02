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
  const isActive = data.get("isActive");
  if (typeof isActive !== "string") {
    return NextResponse.json({ ok: false, error: "Missing isActive" }, { status: 400 });
  }
  const { id } = await context.params;
  await prisma.product.update({
    where: { id },
    data: { isActive: isActive === "true" },
  });
  return NextResponse.json({ ok: true });
}
