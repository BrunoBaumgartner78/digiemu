// src/app/account/profile/page.tsx
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfilePageClient from "./ProfilePageClient";
import type { InitialProfile } from "./ProfilePageClient";
import styles from "./profile.module.css";
import { computeSellerTrustFromDb } from "@/lib/sellerTrust";

export const dynamic = "force-dynamic";

async function getTenantKeySafe(): Promise<string> {
  try {
    const mod = await import("@/lib/tenant-context");
    const fn = (mod as any)?.currentTenant;
    if (typeof fn === "function") {
      const t = await fn();
      const key = (t?.key || t?.tenantKey || "").toString().trim();
      return key || "DEFAULT";
    }
  } catch {
    // ignore
  }
  return "DEFAULT";
}

export default async function Page() {
  const session = await getServerSession(auth);
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

  const tenantKey = await getTenantKeySafe();

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: {
      tenantKey_userId: {
        tenantKey,
        userId,
      },
    },
  });

  // Produktanzahl tenant-safe
  const productCount = await prisma.product.count({
    where: {
      tenantKey,
      vendorId: userId,
    },
  });

  // Trust/Level (ist in sellerTrust.ts bereits tenant-safe)
  const sellerTrust = await computeSellerTrustFromDb(userId);

  const initialProfile = {
    displayName: vendorProfile?.displayName ?? (session?.user as any)?.name ?? "",
    bio: vendorProfile?.bio ?? "",
    isPublic: vendorProfile?.isPublic ?? true,
    avatarUrl: vendorProfile?.avatarUrl ?? "",
    bannerUrl: vendorProfile?.bannerUrl ?? "",
    levelName: sellerTrust.level,
    productCount,
    nextGoal: sellerTrust.nextLevelTarget,
    nextGoalUnit: sellerTrust.nextLevelUnit,
  };

  return (
    <div className={styles.pageWrap}>
      <div className={styles.container}>
        {/* Prisma/Type safety: InitialProfile.nextGoalUnit only supports "products" | "chf" | undefined */}
        {(() => {
          const unitRaw = (initialProfile as any)?.nextGoalUnit;

          const normalized: InitialProfile = {
            ...(initialProfile as any),
            nextGoalUnit:
              unitRaw === "products" ? "products" : unitRaw ? "chf" : undefined,
          };

          return <ProfilePageClient initialProfile={normalized} />;
        })()}
      </div>
    </div>
  );
}
