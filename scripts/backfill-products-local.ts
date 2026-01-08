#!/usr/bin/env -S npx tsx
import { prisma } from "../src/lib/prisma";
import { MARKETPLACE_TENANT_KEY } from "../src/lib/marketplaceTenant";

async function main() {
  console.log("Marketplace tenant key:", MARKETPLACE_TENANT_KEY);

  const mpKey = MARKETPLACE_TENANT_KEY;

  let mpVendorProfile = await prisma.vendorProfile.findFirst({
    where: { tenantKey: mpKey, status: "APPROVED", isPublic: true, user: { isBlocked: false } },
    select: { id: true, userId: true },
  });

  if (!mpVendorProfile) {
    console.log("No existing APPROVED marketplace vendorProfile found — attempting to copy one from DEFAULT.");
    const base = await prisma.vendorProfile.findFirst({
      where: { tenantKey: "DEFAULT", status: "APPROVED", isPublic: true, user: { isBlocked: false } },
      select: {
        userId: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        bannerUrl: true,
        websiteUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        tiktokUrl: true,
        facebookUrl: true,
        slug: true,
        isPublic: true,
      },
    });

    if (!base) {
      console.error("No suitable DEFAULT vendorProfile to copy. Please create/approve a vendor in MARKETPLACE first.");
      process.exitCode = 2;
      return;
    }

    mpVendorProfile = await prisma.vendorProfile.create({
      data: {
        userId: base.userId,
        tenantKey: mpKey,
        displayName: base.displayName ?? null,
        bio: base.bio ?? null,
        avatarUrl: base.avatarUrl ?? null,
        bannerUrl: base.bannerUrl ?? null,
        websiteUrl: base.websiteUrl ?? null,
        twitterUrl: base.twitterUrl ?? null,
        instagramUrl: base.instagramUrl ?? null,
        tiktokUrl: base.tiktokUrl ?? null,
        facebookUrl: base.facebookUrl ?? null,
        slug: base.slug ?? null,
        isPublic: base.isPublic ?? true,
        status: "APPROVED",
      },
      select: { id: true, userId: true },
    });

    console.log("Created marketplace vendorProfile:", mpVendorProfile);
  } else {
    console.log("Using vendorProfile:", mpVendorProfile);
  }

  const res = await prisma.product.updateMany({
    where: {
      tenantKey: { in: ["DEFAULT", ""] },
      isActive: true,
      status: { in: ["ACTIVE", "PUBLISHED", "APPROVED"] },
    },
    data: {
      tenantKey: mpKey,
      vendorProfileId: mpVendorProfile.id,
      vendorId: mpVendorProfile.userId,
    },
  });

  console.log("Updated products:", res.count);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
