import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant-context";

export async function POST(req: Request) {
  const session = await getServerSession(auth);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const category = String(body?.category ?? "").trim() || "other";

  const priceChf = Number(body?.priceChf);
  const downloadUrl = String(body?.downloadUrl ?? "").trim();
  const thumbnailUrl = body?.thumbnailUrl ? String(body.thumbnailUrl).trim() : null;

  if (!title) return NextResponse.json({ message: "title is required" }, { status: 400 });
  if (!description) return NextResponse.json({ message: "description is required" }, { status: 400 });
  if (!Number.isFinite(priceChf) || priceChf < 1) {
    return NextResponse.json({ message: "priceChf must be a number >= 1" }, { status: 400 });
  }
  if (!downloadUrl) return NextResponse.json({ message: "downloadUrl is required" }, { status: 400 });

  // ✅ tenant scoping
  const { tenantKey } = await currentTenant();
  const tk = (tenantKey || "DEFAULT").trim() || "DEFAULT";

  // ✅ vendor must have a profile in this tenant (Option B enforced in marketplace query)
  const vp = await prisma.vendorProfile.findFirst({
    where: { userId: session.user.id, tenantKey: tk },
    select: { id: true, status: true, isPublic: true, tenantKey: true },
  });

  if (!vp?.id) {
    return NextResponse.json(
      { message: "VendorProfile missing for this tenant. Create vendor profile first." },
      { status: 400 }
    );
  }

  // ✅ Only approved+public vendors can publish ACTIVE products under Option B
  const canPublish = vp.status === "APPROVED" && vp.isPublic === true;

  const priceCents = Math.round(priceChf * 100);

  const created = await prisma.product.create({
    data: {
      tenantKey: vp.tenantKey ?? tk,
      vendorId: session.user.id,

      // ✅ always attach the vendor profile from (tenantKey,userId)
      vendorProfileId: vp.id,

      title: String(title ?? "").trim(),
      description: String(description ?? "").trim(),
      priceCents,
      fileUrl: String(downloadUrl ?? "").trim(),
      thumbnail: thumbnailUrl ?? null,
      category: String(category ?? "other").trim(),

      // ✅ default: always DRAFT — vendors must publish or admin approve
      status: "DRAFT",
      isActive: true,
    },
    select: { id: true, status: true, tenantKey: true, vendorProfileId: true },
  });

  return NextResponse.json({ ok: true, product: created });
}
