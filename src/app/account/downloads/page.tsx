// src/app/account/downloads/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type SearchParams = {
  page?: string;
};

function toInt(v: unknown, fallback: number) {
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function buildPageHref(page: number) {
  return `/account/downloads?page=${page}`;
}

export default async function AccountDownloadsPage({
  searchParams,
}: {
  // ✅ Next.js 16: searchParams ist Promise
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    redirect("/login?callbackUrl=/account/downloads");
  }

  const sp = await searchParams;
  const page = toInt(sp?.page, 1);

  const PAGE_SIZE = 10;
  const skip = (page - 1) * PAGE_SIZE;

  // ✅ Gesamtanzahl für Pagination
  const total = await prisma.order.count({
    where: {
      buyerId: userId,
      status: "PAID",
    },
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  // Wenn jemand ?page=999 aufruft -> auf letzte gültige Seite umleiten
  if (safePage !== page) {
    redirect(buildPageHref(safePage));
  }

  const orders = await prisma.order.findMany({
    where: {
      buyerId: userId,
      status: "PAID",
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
    include: {
      product: {
        select: {
          title: true,
          description: true,
          thumbnail: true,
        },
      },
      downloadLink: true,
    },
  });

  const now = new Date();

  // Pagination UI helpers
  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;

  // Kompakte Seitenanzeige: z.B. 1 … 4 5 6 … 12
  const pages: (number | "...")[] = [];
  const windowSize = 2;

  const push = (x: number | "...") => pages.push(x);

  if (totalPages <= 9) {
    for (let p = 1; p <= totalPages; p++) push(p);
  } else {
    push(1);

    if (safePage - windowSize > 2) push("...");

    const start = Math.max(2, safePage - windowSize);
    const end = Math.min(totalPages - 1, safePage + windowSize);
    for (let p = start; p <= end; p++) push(p);

    if (safePage + windowSize < totalPages - 1) push("...");

    push(totalPages);
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header>
          <h1 className={styles.heading}>Meine Käufe & Downloads</h1>
          <p className={styles.subheading}>
            Hier findest du alle digitalen Produkte, die du gekauft hast.
          </p>
        </header>

        {total === 0 ? (
          <section className={styles.empty}>
            <h2 className={styles.emptyTitle}>Noch keine Käufe</h2>
            <p className={styles.emptyText}>
              Du hast bisher noch keine digitalen Produkte gekauft.
            </p>
            <Link href="/marketplace" className="neobtn primary">
              Zum Marketplace
            </Link>
          </section>
        ) : (
          <>
            {/* ✅ Pagination Top */}
            <div className={styles.paginationBar}>
              <div className={styles.paginationMeta}>
                Seite <strong>{safePage}</strong> von <strong>{totalPages}</strong> ·{" "}
                <span className={styles.muted}>{total} Käufe</span>
              </div>

              <div className={styles.paginationControls}>
                <Link
                  className={`neobtn ghost ${!hasPrev ? styles.disabled : ""}`}
                  href={hasPrev ? buildPageHref(safePage - 1) : buildPageHref(1)}
                  aria-disabled={!hasPrev}
                  tabIndex={!hasPrev ? -1 : 0}
                >
                  ← Zurück
                </Link>

                <div className={styles.pageNumbers}>
                  {pages.map((p, idx) =>
                    p === "..." ? (
                      <span key={`dots-${idx}`} className={styles.dots}>
                        …
                      </span>
                    ) : (
                      <Link
                        key={p}
                        href={buildPageHref(p)}
                        className={
                          "neobtn ghost " + (p === safePage ? styles.pageActive : "")
                        }
                        aria-current={p === safePage ? "page" : undefined}
                      >
                        {p}
                      </Link>
                    )
                  )}
                </div>

                <Link
                  className={`neobtn ghost ${!hasNext ? styles.disabled : ""}`}
                  href={hasNext ? buildPageHref(safePage + 1) : buildPageHref(totalPages)}
                  aria-disabled={!hasNext}
                  tabIndex={!hasNext ? -1 : 0}
                >
                  Weiter →
                </Link>
              </div>
            </div>

            <ul className={styles.list}>
              {orders.map((order) => {
                const productTitle = order.product?.title ?? "Digitales Produkt";

                const link = order.downloadLink;
                const hasLink = Boolean(link?.fileUrl);
                const isExpired =
                  hasLink && link?.expiresAt && link.expiresAt.getTime() < now.getTime();
                const isInactive = link?.isActive === false;

                const maxDownloads = link?.maxDownloads ?? 3;
                const downloadCount = link?.downloadCount ?? 0;
                const isLimitReached = hasLink && downloadCount >= maxDownloads;

                const canDownload =
                  hasLink && !isExpired && !isInactive && !isLimitReached;

                let statusLabel = "Bereit zum Download";
                let statusClass = styles.statusReady;

                if (!hasLink) {
                  statusLabel = "Download wird erstellt";
                  statusClass = styles.statusPending;
                } else if (isExpired || isInactive || isLimitReached) {
                  statusLabel = "Nicht verfügbar";
                  statusClass = styles.statusExpired;
                }

                return (
                  <li key={order.id} className={styles.card}>
                    <div className={styles.thumbWrapper}>
                      {order.product?.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={order.product.thumbnail}
                          alt={productTitle}
                          className={styles.thumbImage}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.thumbPlaceholder}>
                          <span className={styles.thumbInitials}>PDF</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.cardMain}>
                      <h2 className={styles.productTitle}>{productTitle}</h2>

                      <p className={styles.orderMeta}>
                        <span>
                          Bestellnummer:
                          <span className={styles.code}> {order.id}</span>
                        </span>
                      </p>

                      <p className={styles.orderMeta}>
                        <span>
                          Gekauft am{" "}
                          {order.createdAt.toLocaleDateString("de-CH", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </p>

                      {order.product?.description && (
                        <p className={styles.description}>{order.product.description}</p>
                      )}

                      {hasLink && (
                        <p className={styles.orderMeta}>
                          Downloads: {downloadCount}/{maxDownloads}
                        </p>
                      )}
                    </div>

                    <div className={styles.status}>
                      <span className={`${styles.statusBadge} ${statusClass}`}>
                        {statusLabel}
                      </span>

                      <div className={styles.actions}>
                        {canDownload ? (
                          <>
                            <a
                              href={`/api/download/${order.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="neobtn primary"
                            >
                              Jetzt herunterladen
                            </a>
                            <Link href={`/download/${order.id}`} className="neobtn ghost">
                              Zur Download-Seite
                            </Link>
                          </>
                        ) : (
                          <Link href={`/download/${order.id}`} className="neobtn ghost">
                            Details ansehen
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* ✅ Pagination Bottom (optional, aber UX nice) */}
            <div className={styles.paginationBarBottom}>
              <div className={styles.paginationControls}>
                <Link
                  className={`neobtn ghost ${!hasPrev ? styles.disabled : ""}`}
                  href={hasPrev ? buildPageHref(safePage - 1) : buildPageHref(1)}
                  aria-disabled={!hasPrev}
                  tabIndex={!hasPrev ? -1 : 0}
                >
                  ← Zurück
                </Link>

                <span className={styles.paginationMeta}>
                  Seite <strong>{safePage}</strong> / <strong>{totalPages}</strong>
                </span>

                <Link
                  className={`neobtn ghost ${!hasNext ? styles.disabled : ""}`}
                  href={hasNext ? buildPageHref(safePage + 1) : buildPageHref(totalPages)}
                  aria-disabled={!hasNext}
                  tabIndex={!hasNext ? -1 : 0}
                >
                  Weiter →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
