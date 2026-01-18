// src/app/account/profile/page.tsx
import { requireSessionPage } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import ProfilePageClient from "./ProfilePageClient";
import styles from "./profile.module.css";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireSessionPage();
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.container}>
          <div className={styles.card}>
            <h1 className={styles.h1}>Dein Verkäufer-Profil</h1>
            <p className={styles.p}>Bitte einloggen, um dein Profil zu bearbeiten.</p>
          </div>
        </div>
      </div>
    );
  }

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId },
  });

  // Produktanzahl (passe Feldnamen ggf. an!)
  // Häufig: Product.vendorId oder Product.userId oder Product.vendorProfileId
  // Wir versuchen vendorId=userId (typisch) – wenn es bei dir anders ist, sag kurz Bescheid.
  const productCount = await prisma.product.count({
    where: {
      vendorId: userId as any,
    } as any,
  });

  const initialProfile = {
    displayName: vendorProfile?.displayName ?? (session?.user as any)?.name ?? "",
    bio: vendorProfile?.bio ?? "",
    isPublic: vendorProfile?.isPublic ?? true,
    avatarUrl: vendorProfile?.avatarUrl ?? "",
    bannerUrl: vendorProfile?.bannerUrl ?? "",
    levelName: "Starter", // falls du Level in DB hast, hier mappen
    productCount,
    nextGoal: 5,
  };

  return (
    <div className={styles.pageWrap}>
      <div className={styles.container}>
        <ProfilePageClient initialProfile={initialProfile} />
      </div>
    </div>
  );
}
