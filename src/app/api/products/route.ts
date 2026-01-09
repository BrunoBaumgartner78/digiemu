import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { currentTenant } from "@/lib/tenant-context";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  const title = String(data.title ?? "").trim();
  const description = String(data.description ?? "").trim();
  const category = String(data.category ?? "").trim();
  const fileUrl = String(data.fileUrl ?? "").trim();
  const thumbnail = data.thumbnail ? String(data.thumbnail).trim() : null;
  const priceCents = Number(data.priceCents);

  if (!title || !fileUrl || !Number.isFinite(priceCents) || priceCents < 0) {
    return NextResponse.json(
      { error: "Invalid payload (title, fileUrl, priceCents required)" },
      { status: 400 }
    );
  }

  const { tenantKey: rawTenantKey } = await currentTenant();
  const tenantKey = rawTenantKey ?? "DEFAULT";

  const vp = await prisma.vendorProfile.findFirst({ where: { userId, tenantKey }, select: { id: true } });

  const productData: any = {
    // Ensure tenantKey + vendorProfileId are set on create
    tenantKey,
    title,
    description,
    category,
    fileUrl,
    thumbnail,
    priceCents,

    // Relation connect (vendor required)
    vendor: { connect: { id: userId } },
  };

  if (vp && vp.id) {
    productData.vendorProfile = { connect: { id: vp.id } };
  } else {
    // vendorProfileId is non-nullable in schema; use empty-string legacy placeholder when no profile
    productData.vendorProfileId = "";
  }

  const product = await prisma.product.create({ data: productData });

  return NextResponse.json(product);
}
