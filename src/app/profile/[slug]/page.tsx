import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import styles from "./publicProfile.module.css";
import ProductGrid from "./ProductGrid";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export default async function PublicVendorProfilePage({ params }: Props) {
  // In Next.js params can be a Promise in some runtimes — await to be safe
  // (it's safe to await a non-promise too)
  const resolvedParams = (await params) as { slug?: string };
  const slug = decodeURIComponent(resolvedParams?.slug || "").trim();
  if (!slug) notFound();

  const profile = await prisma.vendorProfile.findFirst({
    where: { slug, isPublic: true },
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
    where: { vendorId: profile.userId, isActive: true },
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
          {profile.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.bannerUrl} alt="Banner" className={styles["public-banner"]} />
          ) : (
            <div className={styles["public-banner"]} />
          )}

          <div className={styles["public-header"]}>
            <div>
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt={profile.displayName || "Avatar"} className={styles["public-avatar"]} />
              ) : (
                <div className={styles["public-avatar"]} />
              )}
            </div>

            <div>
              <h1 className={styles["public-name"]}>{profile.displayName || "Verkäufer"}</h1>
              {profile.bio ? <p className={styles["public-bio"]}>{profile.bio}</p> : null}

              <div className={styles["public-meta"]}>
                {profile.websiteUrl ? (
                  <a className={styles["public-pill"]} href={profile.websiteUrl} target="_blank" rel="noreferrer">Website</a>
                ) : null}
                {profile.instagramUrl ? (
                  <a className={styles["public-pill"]} href={profile.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>
                ) : null}
                {profile.twitterUrl ? (
                  <a className={styles["public-pill"]} href={profile.twitterUrl} target="_blank" rel="noreferrer">X/Twitter</a>
                ) : null}
                {profile.tiktokUrl ? (
                  <a className={styles["public-pill"]} href={profile.tiktokUrl} target="_blank" rel="noreferrer">TikTok</a>
                ) : null}
                {profile.facebookUrl ? (
                  <a className={styles["public-pill"]} href={profile.facebookUrl} target="_blank" rel="noreferrer">Facebook</a>
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
