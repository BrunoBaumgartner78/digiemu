// src/app/(app)/profile/[slug]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import ProductGrid from "./ProductGrid";
import styles from "./publicProfile.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PublicVendorProfilePage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(String(slug ?? "")).trim();
  if (!decodedSlug) notFound();

  const profile = await prisma.vendorProfile.findFirst({
    where: {
      OR: [{ slug: decodedSlug }, { userId: decodedSlug }],
      isPublic: true,
    },
    select: {
      id: true,
      slug: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      bannerUrl: true,
      userId: true,
      user: {
        select: {
          name: true,
        },
      },
      products: {
        where: {
          isActive: true,
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          priceCents: true,
          thumbnail: true,
        },
      },
    },
  });

  if (!profile) notFound();

  const safeName =
    profile.displayName?.trim() ||
    profile.user?.name?.trim() ||
    "Verkäufer";

  return (
    <div className={styles["public-profile"]}>
      <section className={styles["public-hero"]}>
        <div className={styles["public-bannerWrap"]}>
          {profile.bannerUrl ? (
            <Image
              src={profile.bannerUrl}
              alt={`${safeName} Banner`}
              fill
              unoptimized
              sizes="100vw"
              className={styles["public-bannerImg"]}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className={styles["public-bannerFallback"]} />
          )}
        </div>

        <div className={styles["public-heroInner"]}>
          <div className={styles["public-avatarWrap"]}>
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={safeName}
                fill
                unoptimized
                sizes="96px"
                className={styles["public-avatarImg"]}
                style={{ objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              <div className={styles["public-avatarFallback"]}>
                {safeName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className={styles["public-meta"]}>
            <h1 className={styles["public-title"]}>{safeName}</h1>
            {profile.bio ? (
              <p className={styles["public-bio"]}>{profile.bio}</p>
            ) : null}

            <div className={styles["public-actions"]}>
              <Link href="/marketplace" className="neobtn">
                Zum Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles["public-section"]}>
        <ProductGrid products={profile.products} />
      </section>
    </div>
  );
}