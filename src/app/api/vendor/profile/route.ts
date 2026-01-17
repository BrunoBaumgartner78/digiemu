// src/app/api/vendor/profile/route.ts
import { NextResponse } from "next/server";
import { requireSessionApi, requireRoleApi } from "../../../../lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { getStringProp, getBooleanProp, getErrorMessage, isRecord } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const maybe = await requireSessionApi();
  if (maybe instanceof NextResponse) return maybe;
  const session = maybe;
  const user = isRecord(session?.user) ? session!.user as Record<string, unknown> : null;
  const userId = getStringProp(user, "id");
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId } });
  return NextResponse.json({ vendorProfile });
}

export async function PUT(req: Request) {
  try {
    const maybe = await requireRoleApi(["VENDOR", "ADMIN"]);
    if (maybe instanceof NextResponse) {
      if (maybe.status === 401) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      if (maybe.status === 403) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      return maybe;
    }
    const session = maybe;
    const user = isRecord(session?.user) ? session!.user as Record<string, unknown> : null;
    const userId = getStringProp(user, "id");
    const userRole = getStringProp(user, "role");
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const displayName = getStringProp(body, "displayName");
    const bio = getStringProp(body, "bio");
    const avatarUrl = getStringProp(body, "avatarUrl");
    const bannerUrl = getStringProp(body, "bannerUrl");
    const isPublic = getBooleanProp(body, "isPublic");

    // Only vendor or admin may update their profile
    if (userRole !== "VENDOR" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const upsertData: Record<string, unknown> = {};
    if (displayName !== null) upsertData.displayName = displayName;
    if (bio !== null) upsertData.bio = bio;
    if (avatarUrl !== null) upsertData.avatarUrl = avatarUrl;
    if (bannerUrl !== null) upsertData.bannerUrl = bannerUrl;
    if (isPublic !== null) upsertData.isPublic = isPublic;

    const vendorProfile = await prisma.vendorProfile.upsert({
      where: { userId },
      create: { userId, ...upsertData },
      update: upsertData,
    });

    return NextResponse.json({ ok: true, vendorProfile });
  } catch (err: unknown) {
    console.error("❌ vendor profile update error:", getErrorMessage(err));
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
