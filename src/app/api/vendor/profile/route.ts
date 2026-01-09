// src/app/api/vendor/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tenantKey: rawTenantKey } = await currentTenant();
  const tenantKey = rawTenantKey ?? "DEFAULT";

  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { tenantKey_userId: { tenantKey, userId } } });
  return NextResponse.json({ vendorProfile });
}

export async function PUT(req: Request) {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const displayName = String(body.displayName ?? "").trim();
  const bio = String(body.bio ?? "").trim();
  const avatarUrl = String(body.avatarUrl ?? "").trim();
  const bannerUrl = String(body.bannerUrl ?? "").trim();
  const isPublic = Boolean(body.isPublic ?? true);

  const { tenantKey: rawTenantKey2 } = await currentTenant();
  const tenantKey2 = rawTenantKey2 ?? "DEFAULT";

  const vendorProfile = await prisma.vendorProfile.upsert({
    where: { tenantKey_userId: { tenantKey: tenantKey2, userId } },
    create: { tenantKey: tenantKey2, userId, displayName, bio, avatarUrl, bannerUrl, isPublic },
    update: { displayName, bio, avatarUrl, bannerUrl, isPublic },
  });

  return NextResponse.json({ ok: true, vendorProfile });
}
