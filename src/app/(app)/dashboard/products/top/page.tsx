import { requireRolePage } from "@/lib/guards/authz";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import styles from "./TopLikedProducts.module.css";

export const dynamic = "force-dynamic";

export default async function TopLikedProductsPage() {
  const session = await requireRolePage(["VENDOR", "ADMIN"]);
  if (!session) redirect("/login");

  const user = session.user as any;
  const vendorId = user.id;

  // Top-Produkte nach Likes (Fallback: Orders)
  const products = await prisma.product.findMany({
    where: { vendorId },
    orderBy: [
      { likes: { _count: "desc" } },
      { orders: { _count: "desc" } },
      { createdAt: "desc" },
    ],
    take: 20,
    include: {
      _count: {
        select: {
          likes: true,
          orders: true,
        },
      },
    },
  });

  const ids = products.map((p) => p.id);

  const viewsAgg = ids.length
    ? await prisma.productView.groupBy({
        by: ["productId"],
        where: { productId: { in: ids } },
        _count: { _all: true },
      })
    : [];

  const viewsMap = new Map<string, number>(
    viewsAgg.map((r) => [r.productId, r._count._all])
  );

  return (
    <main className="page-shell-wide">
      <section className="neo-surface p-6 md:p-8 space-y-6">
        <header className={styles.headerRow}>
          <div>
            <p className={styles.eyebrow}>Analytics</p>
            <h1 className={styles.title}>Deine beliebtesten Produkte</h1>
            <p className={styles.subtitle}>
              Übersicht nach Likes – welche Produkte landen am häufigsten auf der Merkliste deiner Käufer:innen.
            </p>
          </div>

          <div className={styles.headerActions}>
           <Link
  href="/dashboard/products"
  className={`${styles.ghostBtn} ${styles.topBackBtn}`}
>
  Zur Produktübersicht
</Link>


          </div>
        </header>

        {products.length === 0 && (
          <div className={styles.emptyCard}>
            <h2 className={styles.emptyTitle}>Noch keine Daten</h2>
            <p className={styles.emptyText}>
              Es wurden bisher keine Likes für deine Produkte vergeben.
              Sobald Käufer:innen die Merkliste nutzen, erscheinen hier deine Top-Produkte.
            </p>
            <Link href="/marketplace" className={styles.emptyBtn}>
              Marketplace ansehen
            </Link>
          </div>
        )}

        {products.length > 0 && (
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <span>Produkt</span>
              <span className={styles.colSmall}>Likes</span>
              <span className={styles.colSmall}>Downloads</span>
              <span className={styles.colSmall}>Views</span>
              <span className={styles.colSmall}>Status</span>
              <span className={styles.colSmall}>Aktion</span>
            </div>

            <div className={styles.tableBody}>
              {products.map((p) => {
                const price = (p.priceCents ?? 0) / 100;
                const likesCount = p._count.likes ?? 0;
                const ordersCount = p._count.orders ?? 0;
                const viewsCount = viewsMap.get(p.id) ?? 0;

                const isBlocked = p.status === "BLOCKED";
                const isActive = p.isActive === true && !isBlocked;

                return (
                  <div key={p.id} className={styles.tableRow}>
                    <div className={styles.prodCell}>
                      <div className={styles.prodTitleLine}>
                        <Link
                          href={`/dashboard/products/${p.id}/edit`}
                          className={styles.prodTitle}
                        >
                          {p.title}
                        </Link>
                        <span className={styles.prodPrice}>
                          CHF {price.toFixed(2)}
                        </span>
                      </div>
                      <p className={styles.prodDescription}>
                        {p.description
                          ? p.description.slice(0, 120) +
                            (p.description.length > 120 ? " …" : "")
                          : "Keine Beschreibung hinterlegt."}
                      </p>
                    </div>

                    <div className={styles.colSmall}>
                      <span className={styles.badgeLikes}>
                        {likesCount}
                      </span>
                    </div>

                    <div className={styles.colSmall}>
                      <span className={styles.badgeDownloads}>
                        {ordersCount}
                      </span>
                    </div>

                    <div className={styles.colSmall}>
                      <span className={styles.badgeViews}>
                        {viewsCount}
                      </span>
                    </div>

                    <div className={styles.colSmall}>
                      <span
                        className={
                          isActive
                            ? styles.statusPillLive
                            : isBlocked
                            ? styles.statusPillBlocked
                            : styles.statusPillDraft
                        }
                      >
                        {isActive
                          ? "Aktiv"
                          : isBlocked
                          ? "Blockiert"
                          : "Entwurf"}
                      </span>
                    </div>

                    <div className={styles.colSmall}>
                      <div className={styles.actionRow}>
                        <Link
                          href={`/product/${p.id}`}
                          className={styles.linkTiny}
                        >
                          Öffnen
                        </Link>
                        <Link
                          href={`/dashboard/products/${p.id}/edit`}
                          className={styles.linkTinyMuted}
                        >
                          Bearbeiten
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
