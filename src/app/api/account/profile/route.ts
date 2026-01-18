import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireSessionApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp, getBooleanProp, getErrorMessage } from "@/lib/guards";
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

async function handleUpsert(_req: Request) {
  const sessionOrResp = await requireSessionApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as Session;
  const user = isRecord(session?.user) ? session!.user as Record<string, unknown> : null;
  const userId = getStringProp(user, "id");

  if (!userId) {
    return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });
  }

  const body: unknown = await _req.json().catch(() => ({} as unknown));
  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, message: "INVALID_BODY" }, { status: 400 });
  }

  try {
    // Validate image URLs: prevent blob: URLs being saved
    const avatarUrl = getStringProp(body, "avatarUrl") ?? "";
    const bannerUrl = getStringProp(body, "bannerUrl") ?? "";
    if (avatarUrl.startsWith("blob:") || bannerUrl.startsWith("blob:")) {
      return NextResponse.json({ ok: false, message: "INVALID_IMAGE_URL", detail: "Bitte Avatar/Banner zuerst hochladen (keine blob:-URL)." }, { status: 400 });
    }

    const slugClean = sanitizeSlug(getStringProp(body, "slug") ?? "");
    let slugOrNull = slugClean.length > 0 ? slugClean : null;

    // ✅ Whitelist only VendorProfile fields (removed youtubeUrl)
    const data: Record<string, unknown> = {
      displayName: getStringProp(body, "displayName") ?? "",
      bio: getStringProp(body, "bio") ?? "",
      websiteUrl: getStringProp(body, "websiteUrl") ?? "",
      instagramUrl: getStringProp(body, "instagramUrl") ?? "",
      twitterUrl: getStringProp(body, "twitterUrl") ?? "",
      tiktokUrl: getStringProp(body, "tiktokUrl") ?? "",
      facebookUrl: getStringProp(body, "facebookUrl") ?? "",
      avatarUrl,
      bannerUrl,
      // slug will be finalized below (generated if missing and made unique)
      slug: null,
      isPublic: getBooleanProp(body, "isPublic") ?? false,
    };

    // If no slug provided, generate one from displayName
    if (!slugOrNull) {
      const base = sanitizeSlug(String(data.displayName || ""));
      slugOrNull = base || `user-${String(userId).slice(0, 8)}`;
    }

    // Ensure uniqueness: if slug exists for another user, append -2, -3, ...
    let candidate = slugOrNull;
    for (let i = 2; i < 200; i++) {
      const exists = await prisma.vendorProfile.findFirst({ where: { slug: candidate, NOT: { userId } }, select: { id: true } });
      if (!exists) break;
      candidate = `${slugOrNull}-${i}`;
    }

    data.slug = candidate;

    const saved = await prisma.vendorProfile.upsert({ where: { userId }, create: { userId, ...data }, update: { ...data } });

    return NextResponse.json({ ok: true, profile: { id: saved.id, slug: saved.slug, isPublic: saved.isPublic } });
  } catch (err: unknown) {
    // ✅ Unique constraint: slug already taken
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const meta = (err as unknown as { meta?: unknown }).meta;
      // meta may be an object with `target` array
      if (isRecord(meta)) {
        const tgt = (meta as Record<string, unknown>).target;
        if (Array.isArray(tgt) && tgt.every((x) => typeof x === "string")) {
          const target = tgt as string[];
          if (target.includes("slug")) {
            return NextResponse.json({ ok: false, message: "SLUG_TAKEN" }, { status: 409 });
          }
        }
      }
      return NextResponse.json({ ok: false, message: "UNIQUE_CONSTRAINT" }, { status: 409 });
    }

    console.error("Profile upsert error:", getErrorMessage(err));
    return NextResponse.json({ ok: false, message: "SERVER_ERROR" }, { status: 500 });
  }
}

// ✅ akzeptiere PUT (Client) + POST (falls irgendwo noch alt verwendet)
export async function PUT(_req: Request) {
  return handleUpsert(_req);
}

export async function POST(_req: Request) {
  return handleUpsert(_req);
}
