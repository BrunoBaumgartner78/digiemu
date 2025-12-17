import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function sanitizeSlug(input: string) {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function handleUpsert(req: Request) {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => null)) as Record<string, any> | null;
  if (!body) {
    return NextResponse.json(
      { ok: false, message: "INVALID_BODY" },
      { status: 400 }
    );
  }

  // Validate image URLs: prevent blob: URLs being saved
  const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl : "";
  const bannerUrl = typeof body.bannerUrl === "string" ? body.bannerUrl : "";
  if (avatarUrl.startsWith("blob:") || bannerUrl.startsWith("blob:")) {
    return NextResponse.json(
      { ok: false, message: "INVALID_IMAGE_URL", detail: "Bitte Avatar/Banner zuerst hochladen (keine blob:-URL)." },
      { status: 400 }
    );
  }

  const slugClean = sanitizeSlug(body.slug ?? "");
  let slugOrNull = slugClean.length > 0 ? slugClean : null;

  // ✅ Whitelist only VendorProfile fields (removed youtubeUrl)
  const data: any = {
    displayName: typeof body.displayName === "string" ? body.displayName : "",
    bio: typeof body.bio === "string" ? body.bio : "",
    websiteUrl: typeof body.websiteUrl === "string" ? body.websiteUrl : "",
    instagramUrl: typeof body.instagramUrl === "string" ? body.instagramUrl : "",
    twitterUrl: typeof body.twitterUrl === "string" ? body.twitterUrl : "",
    tiktokUrl: typeof body.tiktokUrl === "string" ? body.tiktokUrl : "",
    facebookUrl: typeof body.facebookUrl === "string" ? body.facebookUrl : "",
    avatarUrl,
    bannerUrl,
    // slug will be finalized below (generated if missing and made unique)
    slug: null,
    isPublic: Boolean(body.isPublic),
  };

  try {
    // If no slug provided, generate one from displayName
    if (!slugOrNull) {
      const base = sanitizeSlug(data.displayName || "");
      slugOrNull = base || `user-${String(userId).slice(0, 8)}`;
    }

    // Ensure uniqueness: if slug exists for another user, append -2, -3, ...
    let candidate = slugOrNull;
    for (let i = 2; i < 200; i++) {
      const exists = await prisma.vendorProfile.findFirst({
        where: { slug: candidate, NOT: { userId } },
        select: { id: true },
      });
      if (!exists) break;
      candidate = `${slugOrNull}-${i}`;
    }

    data.slug = candidate;

    const saved = await prisma.vendorProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    });

    return NextResponse.json({ ok: true, profile: { id: saved.id, slug: saved.slug, isPublic: saved.isPublic } });
  } catch (err: any) {
    // ✅ Unique constraint: slug already taken
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta as any)?.target;
      if (Array.isArray(target) && target.includes("slug")) {
        return NextResponse.json(
          { ok: false, message: "SLUG_TAKEN" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, message: "UNIQUE_CONSTRAINT" },
        { status: 409 }
      );
    }

    console.error("Profile upsert error:", err);
    return NextResponse.json(
      { ok: false, message: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// ✅ akzeptiere PUT (Client) + POST (falls irgendwo noch alt verwendet)
export async function PUT(req: Request) {
  return handleUpsert(req);
}

export async function POST(req: Request) {
  return handleUpsert(req);
}
