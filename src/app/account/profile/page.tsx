// src/app/account/profile/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";
import { getProfileBadges } from "@/lib/profileBadges";
import ProfilePageClient from "../profile/ProfilePageClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId },
  });

  // Fallback, falls noch kein Profil existiert
  const safeProfile = vendorProfile ?? {
    displayName: "",
    bio: "",
    websiteUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    tiktokUrl: "",
    facebookUrl: "",
    avatarUrl: "",
    bannerUrl: "",
    slug: "",
    isPublic: true,
    id: null as string | null,
  };

  const initialData = {
    displayName: safeProfile.displayName ?? "",
    bio: safeProfile.bio ?? "",
    websiteUrl: safeProfile.websiteUrl ?? "",
    instagramUrl: safeProfile.instagramUrl ?? "",
    twitterUrl: safeProfile.twitterUrl ?? "",
    youtubeUrl: typeof (safeProfile as any).youtubeUrl === "string" ? (safeProfile as any).youtubeUrl ?? "" : "",
    tiktokUrl: safeProfile.tiktokUrl ?? "",
    facebookUrl: safeProfile.facebookUrl ?? "",
    avatarUrl: safeProfile.avatarUrl ?? "",
    bannerUrl: safeProfile.bannerUrl ?? "",
    slug: safeProfile.slug ?? "",
    isPublic: safeProfile.isPublic ?? true,
  };

  // Stats: aktuell nur Anzahl Produkte
  let productCount = 0;
  if (safeProfile.id) {
    productCount = await prisma.product.count({
      where: { vendorId: safeProfile.id },
    });
  }

  const badgeInfo = getProfileBadges({ productCount });

  const initialStats = {
    productCount,
    level: badgeInfo.level,
    badges: badgeInfo.badges,
  };

  return (
    <ProfilePageClient
      userId={userId}
      initialData={initialData}
      initialStats={initialStats}
    />
  );
}
