import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import styles from "./publicProfile.module.css";
import ProductGrid from "./ProductGrid";
import SafeImg from "@/components/ui/SafeImg";

export const dynamic = "force-dynamic";

// ✅ Next.js 16: params ist Promise-wrapped (kein Union!)
type Props = { params: Promise<{ slug: string }> };

export default async function PublicVendorProfilePage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(String(slug ?? "")).trim();
  if (!decodedSlug) notFound();

  const profile = await prisma.vendorProfile.findFirst({
    where: { slug: decodedSlug, isPublic: true },
    select: {
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
      userId: true,
    },
  });

  if (!profile) notFound();

  const products = await prisma.product.findMany({
    where: { vendorId: profile.userId, isActive: true, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: {
      id: true,
      title: true,
      priceCents: true,
      thumbnail: true,
    },
  });

  return (
    <main className={styles["public-shell"]}>
      <div className={styles["public-wrap"]}>
        <section className={styles["public-hero"]}>
            <div className={styles["public-bannerWrap"]}>
            <SafeImg
              src={profile.bannerUrl ?? "/fallback-banner.svg"}
              alt="Banner"
              className={styles["public-banner"]}
              // Banner: soll immer füllen, aber nie overflow erzeugen
              fallback={<div className={styles["public-bannerFallback"]} />}
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
          </div>

          <div className={styles["public-header"]}>
            <div className={styles["public-avatarWrap"]}>
              <SafeImg
                src={profile.avatarUrl}
                alt={profile.displayName || "Avatar"}
                className={styles["public-avatar"]}
                fallback={<div className={styles["public-avatarFallback"]} />}
                sizes="160px"
                style={{ objectFit: "cover" }}
              />
            </div>

            <div>
              <h1 className={styles["public-name"]}>{profile.displayName || "Verkäufer"}</h1>
              {profile.bio ? <p className={styles["public-bio"]}>{profile.bio}</p> : null}

              <div className={styles["public-meta"]}>
                {profile.websiteUrl ? (
                  <a
                    className={styles["public-pill"]}
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Website
                  </a>
                ) : null}
                {profile.instagramUrl ? (
                  <a
                    className={styles["public-pill"]}
                    href={profile.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Instagram
                  </a>
                ) : null}
                {profile.twitterUrl ? (
                  <a
                    className={styles["public-pill"]}
                    href={profile.twitterUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    X/Twitter
                  </a>
                ) : null}
                {profile.tiktokUrl ? (
                  <a
                    className={styles["public-pill"]}
                    href={profile.tiktokUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    TikTok
                  </a>
                ) : null}
                {profile.facebookUrl ? (
                  <a
                    className={styles["public-pill"]}
                    href={profile.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Facebook
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section>
          <ProductGrid products={products} />
        </section>
      </div>
    </main>
  );
}
