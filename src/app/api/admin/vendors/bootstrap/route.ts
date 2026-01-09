import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant-context";

export async function POST(req: Request) {
  const session = await getServerSession(auth);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // form-encoded
  const form = await req.formData();
  const userId = String(form.get("userId") ?? "");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const { tenantKey: rawTenantKey } = await currentTenant();
  const tenantKey = rawTenantKey ?? "DEFAULT";

  // create if missing (idempotent)
  const existing = await prisma.vendorProfile.findFirst({
    where: { userId, tenantKey },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.redirect(new URL("/admin/users", req.url));
  }

  await prisma.vendorProfile.create({
    data: {
      userId,
      tenantKey,
      status: "PENDING",
      isPublic: true,
    },
  });

  return NextResponse.redirect(new URL("/admin/users", req.url));
}
