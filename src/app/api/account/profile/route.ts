import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const {
    displayName,
    bio,
    websiteUrl,
    instagramUrl,
    twitterUrl,
    tiktokUrl,
    facebookUrl,
    avatarUrl,
    bannerUrl,
    slug,
    isPublic = true,
  } = body;

  // Slug vorbereiten
  let finalSlug: string | null = null;
  if (isPublic) {
    const baseName =
      slug?.trim() ||
      displayName?.trim() ||
      session.user.name?.trim() ||
      session.user.email?.split("@")[0] ||
      session.user.id;
    let candidate = slugify(baseName);
    if (!candidate) {
      candidate = slugify(session.user.id);
    }

    // unique machen
    let suffix = 1;
    let uniqueSlug = candidate;
    // Alte Slug des Users holen, falls vorhanden
    const existingProfile = await prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
      select: { slug: true },
    });

    if (existingProfile?.slug && !slug) {
      uniqueSlug = existingProfile.slug;
    } else {
      while (true) {
        const conflict = await prisma.vendorProfile.findFirst({
          where: { slug: uniqueSlug },
          select: { userId: true },
        });
        if (!conflict || conflict.userId === session.user.id) break;
        suffix += 1;
        uniqueSlug = `${candidate}-${suffix}`;
      }
    }
    finalSlug = uniqueSlug;
  }

  const profile = await prisma.vendorProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      displayName,
      bio,
      avatarUrl,
      bannerUrl,
      websiteUrl,
      twitterUrl,
      instagramUrl,
      tiktokUrl,
      facebookUrl,
      slug: finalSlug,
      isPublic,
    },
    update: {
      displayName,
      bio,
      avatarUrl,
      bannerUrl,
      websiteUrl,
      twitterUrl,
      instagramUrl,
      tiktokUrl,
      facebookUrl,
      slug: finalSlug,
      isPublic,
    },
  });

  return NextResponse.json({ ok: true, profile });
}
