import { getSellerTrustInfo } from "@/lib/sellerTrust";
import type { Metadata } from "next";
// SEO metadata for seller page
export async function generateMetadata({ params }: { params: Promise<{ vendorId: string }> }): Promise<Metadata> {
  const { vendorId } = await params;
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorId },
    select: {
      id: true,
      isPublic: true,
      displayName: true,
      bio: true,
      bannerUrl: true,
      avatarUrl: true,
      user: { select: { name: true } },
    },
  });
  if (!vendor) {
    return { title: "Verkäufer nicht gefunden – DigiEmu", robots: { index: false, follow: false } };
  }
  if (!vendor.isPublic) {
    return {
      title: "Privates Verkäuferprofil – DigiEmu",
      robots: { index: false, follow: false },
    };
  }
  const sellerName = vendor.displayName || vendor.user?.name || "Verkäufer";
  const desc = vendor.bio?.trim()?.slice(0, 160) || `Digitale Produkte von ${sellerName} auf DigiEmu`;
  const images = [vendor.bannerUrl, vendor.avatarUrl].filter(Boolean) as string[];
  return {
    title: `${sellerName} – Verkäufer auf DigiEmu`,
    description: desc,
    openGraph: {
      title: `${sellerName} – Verkäufer auf DigiEmu`,
      description: desc,
      images,
    },
    robots: { index: true, follow: true },
    alternates: { canonical: `/seller/${vendorId}` },
  };
}
// src/app/seller/[vendorId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = {
  // du nutzt im Projekt an mehreren Stellen Next16-params als Promise → ok so
  params: Promise<{ vendorId: string }>;
};

function getInitial(name: string) {
  const n = (name || "").trim();
  return n ? n[0]!.toUpperCase() : "V";
}

export default async function SellerProfilePage({ params }: Props) {
  const { vendorId } = await params;

  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorId },
    select: {
      id: true,
      userId: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      bannerUrl: true,
      websiteUrl: true,
      instagramUrl: true,
      twitterUrl: true,
      tiktokUrl: true,
      facebookUrl: true,
      isPublic: true,
      user: { select: { name: true } },
    },
  });

  if (!vendor) notFound();

  // optional: wenn Profil privat ist, dann “privat” anzeigen statt alles zeigen
  if (!vendor.isPublic) {
    const sellerName = vendor.displayName || vendor.user?.name || "Verkäufer";
    return (
      <main className={styles.page}>
        <section className={styles.privateCard}>
          <h1 className={styles.name}>{sellerName}</h1>
          <p className={styles.bio}>Dieses Verkäuferprofil ist privat.</p>
          <div className={styles.backLinks}>
            <Link href="/marketplace" className="neobtn primary">
              Zum Marketplace
            </Link>
            <Link href="/" className="neobtn ghost">
              Startseite
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // Robust: einige Datenstände speichern Product.vendorId = vendorProfile.id,
  // andere evtl. Product.vendorId = userId → wir unterstützen beide.
  // Count active products for trust signals
  const activeProductCount = await prisma.product.count({
    where: {
      OR: [
        { vendorProfileId: vendor.id },
        { vendorId: vendor.userId },
      ],
      isActive: true,
      status: "ACTIVE",
    },
  });

  // Fetch products for grid
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { vendorProfileId: vendor.id },
        { vendorId: vendor.userId },
      ],
      isActive: true,
      status: "ACTIVE",
    },
  });

  // Trust signals
  const trust = getSellerTrustInfo(activeProductCount);

  const sellerName = vendor.displayName || vendor.user?.name || "Verkäufer";
  const initial = getInitial(sellerName);

  return (
    <main className={styles.page}>
      {/* Banner */}
      <section className={styles.banner}>
        {vendor.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vendor.bannerUrl}
            alt={`${sellerName} Banner`}
            className={styles.bannerImg}
          />
        ) : (
          <div className={styles.bannerPlaceholder} aria-hidden="true" />
        )}
      </section>

      {/* Header + Trust signals */}
      <section className={styles.headerCard}>
        <div className={styles.avatarWrap}>
          {vendor.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vendor.avatarUrl}
              alt={sellerName}
              className={styles.avatarImg}
            />
          ) : (
            <div className={styles.avatarFallback} aria-hidden="true">
              {initial}
            </div>
          )}
        </div>

        <div className={styles.headerText}>
          <h1 className={styles.name}>{sellerName}</h1>
          <p className={styles.bio}>
            {vendor.bio?.trim() ? vendor.bio : "Noch keine Bio hinterlegt."}
          </p>

          {/* Trust signals */}
          <div className={styles.trustCard}>
            <span className={styles.trustLevel}>Level: {trust.level}</span>
            <span className={styles.trustCount}>{activeProductCount} Produkte</span>
            <div className={styles.trustProgressBarWrap}>
              <div className={styles.trustProgressBarBg}>
                <div
                  className={styles.trustProgressBarFill}
                  style={{ width: `${Math.round(trust.progress * 100)}%` }}
                />
              </div>
              <span className={styles.trustProgressText}>
                {activeProductCount} / {trust.nextLevelTarget} bis {trust.level === "Pro" ? "Max" : trust.level === "Creator" ? "Pro" : "Creator"}
              </span>
            </div>
            <div className={styles.trustBadges}>
              {trust.badges.map((b) => (
                <span key={b} className={styles.trustBadge}>{b}</span>
              ))}
            </div>
          </div>

          <div className={styles.links}>
            {vendor.websiteUrl && (
              <a className="neo-link" href={vendor.websiteUrl} target="_blank" rel="noreferrer">
                Website
              </a>
            )}
            {vendor.instagramUrl && (
              <a className="neo-link" href={vendor.instagramUrl} target="_blank" rel="noreferrer">
                Instagram
              </a>
            )}
            {vendor.twitterUrl && (
              <a className="neo-link" href={vendor.twitterUrl} target="_blank" rel="noreferrer">
                Twitter/X
              </a>
            )}
            {vendor.tiktokUrl && (
              <a className="neo-link" href={vendor.tiktokUrl} target="_blank" rel="noreferrer">
                TikTok
              </a>
            )}
            {vendor.facebookUrl && (
              <a className="neo-link" href={vendor.facebookUrl} target="_blank" rel="noreferrer">
                Facebook
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className={styles.productsSection}>
        <div className={styles.productsHeader}>
          <h2>Produkte von {sellerName}</h2>
          <p className={styles.productsSub}>
            {products.length === 0
              ? "Dieser Verkäufer hat noch keine Produkte veröffentlicht."
              : `${products.length} Produkt${products.length === 1 ? "" : "e"} im Shop`}
          </p>
        </div>

        {products.length > 0 && (
          <div className={styles.grid}>
            {products.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className={styles.card}>
                <div className={styles.thumbWrap}>
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt={p.title} className={styles.thumbImg} />
                  ) : (
                    <div className={styles.thumbPlaceholder} aria-hidden="true">
                      <span>{p.title?.charAt(0)?.toUpperCase() || "💾"}</span>
                    </div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{p.title}</h3>

                  {p.description && (
                    <p className={styles.desc}>
                      {p.description.length > 120 ? p.description.slice(0, 117) + "..." : p.description}
                    </p>
                  )}

                  <div className={styles.meta}>
                    <span className={styles.price}>{(p.priceCents / 100).toFixed(2)} CHF</span>
                    <span className={styles.cat}>{p.category || "Digital"}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
