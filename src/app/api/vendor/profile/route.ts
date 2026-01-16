// src/app/api/vendor/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  return NextResponse.json({ vendorProfile });
}

export async function PUT(_req: Request) {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await _req.json().catch(() => ({}));
  const displayName = String(body.displayName ?? "").trim();
  const bio = String(body.bio ?? "").trim();
  const avatarUrl = String(body.avatarUrl ?? "").trim();
  const bannerUrl = String(body.bannerUrl ?? "").trim();
  const isPublic = Boolean(body.isPublic ?? true);

  const vendorProfile = await prisma.vendorProfile.upsert({
    where: { userId },
    create: { userId, displayName, bio, avatarUrl, bannerUrl, isPublic },
    update: { displayName, bio, avatarUrl, bannerUrl, isPublic },
  });

  return NextResponse.json({ ok: true, vendorProfile });
}
