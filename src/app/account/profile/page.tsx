import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfilePageClient from "./ProfilePageClient";
import  style from "./page.module.css";
import "./profile.module.css";

export default async function Page() {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;

  // Fetch vendor profile if exists
  const vendorProfile = userId
    ? await prisma.vendorProfile.findUnique({ where: { userId } })
    : null;

  // Compute product count for this vendor (vendorId references User.id)
  const productCount = userId
    ? await prisma.product.count({ where: { vendorId: userId } })
    : 0;

  const level =
    productCount >= 20 ? "Pro" : productCount >= 5 ? "Creator" : "Starter";

  const initialStats = { level, productCount, badges: [] };

  const initialData = vendorProfile
    ? {
        displayName: vendorProfile.displayName ?? "",
        bio: vendorProfile.bio ?? "",
        websiteUrl: vendorProfile.websiteUrl ?? "",
        instagramUrl: vendorProfile.instagramUrl ?? "",
        twitterUrl: vendorProfile.twitterUrl ?? "",
        tiktokUrl: vendorProfile.tiktokUrl ?? "",
        facebookUrl: vendorProfile.facebookUrl ?? "",
        avatarUrl: vendorProfile.avatarUrl ?? "",
        bannerUrl: vendorProfile.bannerUrl ?? "",
        slug: vendorProfile.slug ?? "",
        isPublic: vendorProfile.isPublic ?? true,
      }
    : null;

  return (
    <div className="min-h-[calc(100vh-6rem)] px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Server page: compute data and render client editor only. */}
        <ProfilePageClient
          userId={userId ?? ""}
          initialData={initialData}
          initialStats={initialStats}
          vendorProfileId={vendorProfile?.id ?? null}
        />
      </div>
    </div>
  );
}
