import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import LikeButtonClient from "@/components/product/LikeButtonClient";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type ProductParams = {
  id: string;
};

// Next 16: params ist ein Promise
type ProductPageProps = {
  params: Promise<ProductParams>;
};

const SAFE_IMAGE_HOSTS = [
  "firebasestorage.googleapis.com",
  "lh3.googleusercontent.com",
  "images.pexels.com",
  "images.unsplash.com",
];

function canUseNextImage(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return SAFE_IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

// Datentyp für diese Seite
type ProductWithSocial = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  thumbnail: string | null;
  category: string | null;
  vendorId: string;
  vendor: { name: string | null } | null;
  _count: { likes: number };
  likes: { id: string }[]; // für initialIsLiked
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  if (!id) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <section className={styles.notFoundCard} role="status">
            <h1 className={styles.notFoundTitle}>Produkt-ID fehlt</h1>
            <p className={styles.notFoundText}>
              Die Produktseite konnte nicht geladen werden, weil keine gültige
              ID übergeben wurde.
            </p>
            <div className={styles.notFoundActions}>
              <Link href="/marketplace" className="neobtn primary">
                Zum Marketplace
              </Link>
              <Link href="/" className="neobtn ghost">
                Zur Startseite
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;

  let product: ProductWithSocial | null = null;

  if (userId) {
    // eingeloggter User → likes nach diesem User gefiltert
    const p = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        priceCents: true,
        thumbnail: true,
        category: true,
        vendorId: true,
        vendor: {
          select: {
            name: true,
          },
        },
        _count: {
          select: { likes: true },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    if (p) {
      product = {
        id: p.id,
        title: p.title,
        description: p.description,
        priceCents: p.priceCents,
        thumbnail: p.thumbnail ?? null,
        category: p.category,
        vendorId: p.vendorId,
        vendor: p.vendor,
        _count: p._count,
        likes: p.likes ?? [],
      };
    }
  } else {
    // kein Login → nur öffentliche Daten + Like-Count
    const p = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        priceCents: true,
        thumbnail: true,
        category: true,
        vendorId: true,
        vendor: {
          select: {
            name: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    if (p) {
      product = {
        id: p.id,
        title: p.title,
        description: p.description,
        priceCents: p.priceCents,
        thumbnail: p.thumbnail ?? null,
        category: p.category,
        vendorId: p.vendorId,
        vendor: p.vendor,
        _count: p._count,
        likes: [],
      };
    }
  }

  if (!product) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <section
            className={styles.notFoundCard}
            role="status"
            aria-live="polite"
          >
            <h1 className={styles.notFoundTitle}>Produkt nicht gefunden</h1>
            <p className={styles.notFoundText}>
              Dieses Produkt konnte nicht geladen werden. Es wurde
              möglicherweise entfernt oder ist noch nicht freigeschaltet.
            </p>
            <div className={styles.notFoundActions}>
              <Link href="/marketplace" className="neobtn primary">
                Zum Marketplace
              </Link>
              <Link href="/" className="neobtn ghost">
                Zur Startseite
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Weitere Produkte dieses Vendors (ohne das aktuelle)
  const relatedProducts = await prisma.product.findMany({
    where: {
      vendorId: product.vendorId,
      id: { not: product.id },
      isActive: true,
      status: "ACTIVE",
    },
    select: {
      id: true,
      title: true,
      priceCents: true,
      thumbnail: true,
      category: true,
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const price = (product.priceCents ?? 0) / 100;
  const showNextImage = canUseNextImage(product.thumbnail);
  const likesCount = product._count?.likes ?? 0;
  const initialIsLiked = !!userId && product.likes.length > 0;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Brotkrumen">
          <ol>
            <li>
              <Link href="/marketplace">Marketplace</Link>
            </li>
            <li aria-current="page">{product.title}</li>
          </ol>
        </nav>

        {/* Oberes Layout: Bild + Kaufkarte */}
        <main className={styles.layout} aria-labelledby="product-title">
          {/* Medien-Karte links */}
          <section className={styles.mediaCard}>
            {showNextImage ? (
              <Image
                src={product.thumbnail as string}
                alt={product.title}
                fill
                priority
                sizes="(min-width: 1024px) 480px, 100vw"
                className={styles.mediaImage}
              />
            ) : (
              <div className={styles.mediaPlaceholder}>
                <span className={styles.mediaIcon} aria-hidden="true">
                  💾
                </span>
                <p className={styles.mediaPlaceholderText}>
                  Digitales Produkt
                </p>
              </div>
            )}
          </section>

          {/* Kaufkarte rechts */}
          <section
            className={styles.buyCard}
            aria-label="Produktinformationen und Kauf"
          >
            <header className={styles.buyHeader}>
              <p className={styles.eyebrow}>Digitales Produkt</p>
              <h1 id="product-title" className={styles.title}>
                {product.title}
              </h1>

              <div className={styles.metaRow}>
                <span className={styles.metaBadge}>
                  {product.category || "Unkategorisiert"}
                </span>
                {product.vendor?.name && (
                  <span className={styles.vendorBadge}>
                    Anbieter:{" "}
                    <span className={styles.vendorName}>
                      {product.vendor.name}
                    </span>
                  </span>
                )}
              </div>
            </header>

            <p className={styles.priceLine}>
              <span className={styles.priceLabel}>Preis</span>
              <span className={styles.priceValue}>
                CHF {price.toFixed(2)}
              </span>
            </p>

            <p className={styles.buyHint}>
              Einmal zahlen – sofort als Download verfügbar.
            </p>

            <form
              action="/api/checkout/session"
              method="POST"
              className={styles.checkoutForm}
            >
              <input type="hidden" name="productId" value={product.id} />
              <button
                type="submit"
                className="neobtn primary"
                aria-label={`Produkt „${product.title}“ jetzt kaufen und sofort herunterladen`}
              >
                Einmal zahlen · sofort laden
              </button>
            </form>

            {/* Social-Bar: Like / Merkliste */}
            <div className={styles.socialBar}>
              <LikeButtonClient
                productId={product.id}
                initialLikesCount={likesCount}
                initialIsLiked={initialIsLiked}
              />
            </div>

            <ul className={styles.benefits} aria-label="Vorteile">
              <li>
                <span aria-hidden="true">⚡</span> Sofortzugriff nach der
                Zahlung
              </li>
              <li>
                <span aria-hidden="true">💳</span> Zahlung über Stripe
                (Kredit-/Debitkarte)
              </li>
              <li>
                <span aria-hidden="true">🛟</span> Support durch DigiEmu &amp;
                den Anbieter
              </li>
            </ul>

            <p className={styles.legalText}>
              inkl. MwSt./digitale Leistung, falls zutreffend. Zugang gemäß
              unseren AGB. Der Download-Link kann technisch zeitlich begrenzt
              sein, das erworbene Produkt bleibt für dich nutzbar.
            </p>
          </section>
        </main>

        {/* NEU: Beschreibungskarte unter dem oberen Layout */}
        {product.description && (
          <section
            className={styles.descriptionSection}
            aria-label="Produktbeschreibung"
          >
            <article className={styles.descriptionCard}>
              <h2>Beschreibung</h2>
              <p>{product.description}</p>
            </article>
          </section>
        )}

        {/* Info-Karten unten */}
        <section
          className={styles.infoGrid}
          aria-label="Details zum digitalen Produkt"
        >
          <article className={styles.infoCard}>
            <h2>Was du bekommst</h2>
            <p>
              Du erhältst ein digitales Produkt als Download. Der genaue Inhalt
              wird vom Anbieter in der Produktbeschreibung erklärt (z. B. PDF,
              ZIP-Archiv, Arbeitsblätter, E-Book oder Vorlagen).
            </p>
            <ul>
              <li>Direkter Download nach dem Kauf</li>
              <li>Nutzung für deinen persönlichen Bedarf</li>
              <li>Kein Versand, kein Warten auf Pakete</li>
            </ul>
          </article>

          <article className={styles.infoCard}>
            <h2>Für wen geeignet?</h2>
            <p>
              Dieses Produkt richtet sich an Käufer:innen, die digitale Inhalte
              bevorzugen und einen schnellen, unkomplizierten Zugang wünschen.
            </p>
            <ul>
              <li>Ideal für Online-Lernen &amp; digitale Workflows</li>
              <li>Kein physischer Lagerplatz nötig</li>
              <li>
                Updates und neue Versionen können vom Anbieter bereitgestellt
                werden
              </li>
            </ul>
          </article>

          <article className={styles.infoCard}>
            <h2>Lieferung &amp; Zugang</h2>
            <p>
              Nach erfolgreicher Zahlung wirst du automatisch auf eine
              Download-Seite weitergeleitet. Dort kannst du deine Datei
              herunterladen, solange dein Zugang aktiv ist.
            </p>
            <ul>
              <li>Download-Link direkt nach der Zahlung</li>
              <li>
                Technische Zugangskontrolle zum Schutz vor Missbrauch
              </li>
              <li>Bei Problemen hilft dir unser Support weiter</li>
            </ul>
          </article>
        </section>

        {/* Mehr Produkte dieses Anbieters */}
        {relatedProducts.length > 0 && (
          <section
            className={styles.relatedSection}
            aria-label="Mehr Produkte dieses Anbieters"
          >
            <div className={styles.relatedHeader}>
              <h2>Mehr Produkte dieses Anbieters</h2>
              {product.vendor?.name && (
                <span className={styles.relatedVendorName}>
                  von {product.vendor.name}
                </span>
              )}
            </div>

            <div className={styles.relatedGrid}>
              {relatedProducts.map((rp) => {
                const rpPrice = (rp.priceCents ?? 0) / 100;
                return (
                  <Link
                    key={rp.id}
                    href={`/product/${rp.id}`}
                    className={styles.relatedCard}
                  >
                    <div className={styles.relatedThumbWrapper}>
                      {rp.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rp.thumbnail}
                          alt={rp.title}
                          className={styles.relatedThumbImage}
                        />
                      ) : (
                        <div className={styles.mediaPlaceholder}>
                          <span
                            className={styles.mediaIcon}
                            aria-hidden="true"
                          >
                            💾
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={styles.relatedBody}>
                      <h3 className={styles.relatedTitle}>{rp.title}</h3>
                      <div className={styles.relatedMeta}>
                        <span>{rp.category || "Digitales Produkt"}</span>
                        <span className={styles.relatedPrice}>
                          CHF {rpPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
