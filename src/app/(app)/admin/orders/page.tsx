import Link from "next/link";
import styles from "../downloads/page.module.css";
import { prisma } from "@/lib/prisma";
import { requireAdminOrRedirect } from "@/lib/guards/admin";
import AdminActionButton from "@/components/admin/AdminActionButton";
import {
  parseAdminListParams,
  formatDateTime,
  formatMoney,
  formatMoneyFromCents,
} from "@/lib/admin/adminList";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdminOrRedirect();

  const sp = await searchParams;

  const { q, status, page, pageSize, from, to, buildQueryString } =
    parseAdminListParams(sp, {
      q: { key: "q", default: "" },
      status: { key: "status", default: "all" },
      page: { key: "page", default: 1 },
      pageSize: { key: "pageSize", default: 25, min: 5, max: 200 },
      from: { key: "from", default: "" },
      to: { key: "to", default: "" },
    });

  const where: any = {};

  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { stripeSessionId: { contains: q, mode: "insensitive" } },
      { buyer: { email: { contains: q, mode: "insensitive" } } },
      { product: { title: { contains: q, mode: "insensitive" } } },
      { downloadLink: { id: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (status !== "all") {
    where.status = status;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const skip = (page - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        buyer: { select: { id: true, email: true, name: true } },

        // ✅ Product hat priceCents (nicht price)
        product: { select: { id: true, title: true, priceCents: true } },

        // ✅ DownloadLink existiert laut Prisma
        downloadLink: { select: { id: true, expiresAt: true, createdAt: true } },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const prevHref = page > 1 ? buildQueryString({ page: String(page - 1) }) : null;
  const nextHref = page < pageCount ? buildQueryString({ page: String(page + 1) }) : null;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>ADMIN</p>
          <h1 className={styles.title}>Orders</h1>
          <p className={styles.subtitle}>
            Suche, Status, Zeitraum + Export. (Drilldown als nächster Schritt.)
          </p>
        </div>

        <div className={styles.actionsRow}>
          <Link className={styles.pill} href="/admin/downloads">
            Downloads
          </Link>
          <a className={styles.pill} href="/api/admin/orders/export">
            Export CSV
          </a>
        </div>

        <form className={styles.filtersCard} method="GET">
          <div className={styles.filtersGrid}>
            <label className={styles.field}>
              <span>Suche</span>
              <input
                name="q"
                placeholder="Order-ID, Buyer E-Mail, Produkt, Stripe Session…"
                defaultValue={q}
              />
            </label>

            <label className={styles.field}>
              <span>Status</span>
              <select name="status" defaultValue={status}>
                <option value="all">(alle)</option>
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="CANCELED">CANCELED</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>From</span>
              <input type="date" name="from" defaultValue={from} />
            </label>

            <label className={styles.field}>
              <span>To</span>
              <input type="date" name="to" defaultValue={to} />
            </label>

            <label className={styles.field}>
              <span>Page size</span>
              <input name="pageSize" defaultValue={String(pageSize)} />
            </label>

            <input type="hidden" name="page" value="1" />
          </div>

          <div className={styles.filterButtons}>
            <button className={styles.primaryBtn} type="submit">
              Filter
            </button>
            <Link className={styles.secondaryBtn} href="/admin/orders">
              Reset
            </Link>
          </div>
        </form>

        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div>DATUM</div>
            <div>BUYER</div>
            <div>PRODUKT</div>
            <div>STATUS</div>
            <div>AMOUNT</div>
            <div>ACTIONS</div>
          </div>

          {rows.length === 0 ? (
            <div className={styles.emptyState}>Keine Orders gefunden.</div>
          ) : (
            rows.map((o: any) => {
              const orderCents = Number(o.amountCents ?? 0);
              const productCents = Number(o.product?.priceCents ?? 0);

              // Wenn Order-Betrag verdächtig klein ist (z.B. 1 Cent bei einem 1.00 CHF Produkt),
              // fallback auf Produktpreis.
              const amountCents = orderCents >= 50 ? orderCents : productCents;

              return (
                <div key={o.id} className={styles.tableRow}>
                  <div className={styles.monoSmall}>
                    {formatDateTime(o.createdAt)}
                  </div>

                  <div>
                    <div className={styles.bold}>
                      {o.buyer?.name || o.buyer?.email || "—"}
                    </div>
                    <div className={styles.mutedSmall}>
                      {o.buyer?.email || "—"} •{" "}
                      <span className={styles.monoSmall}>{o.id}</span>
                    </div>
                  </div>

                  <div>
                    <div className={styles.bold}>{o.product?.title || "—"}</div>
                    <div className={styles.mutedSmall}>
                      {o.product?.id ? (
                        <span className={styles.monoSmall}>{o.product.id}</span>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={styles.badge}>{o.status}</span>
                    {o.stripeSessionId ? (
                      <div className={styles.mutedSmall}>
                        <span className={styles.monoSmall}>
                          {o.stripeSessionId}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.monoSmall}>
                    {formatMoneyFromCents(amountCents, "CHF")}
                  </div>

                  <div className={styles.actionsCell}>
                    <a className={styles.pillSmall} href={`/download/${o.id}`}>
                      View
                    </a>

                    <a
                      className={styles.pillSmall}
                      href={`/api/admin/orders/export?orderId=${encodeURIComponent(o.id)}`}
                    >
                      CSV
                    </a>
                  </div>
                </div>
              );
            })
          )}

          <div className={styles.pagination}>
            <div className={styles.mutedSmall}>
              Total: {total} • Seite {page}/{pageCount}
            </div>
            <div className={styles.paginationBtns}>
              {prevHref ? (
                <Link className={styles.pillSmall} href={prevHref}>
                  ← Prev
                </Link>
              ) : (
                <span className={styles.pillSmallDisabled}>← Prev</span>
              )}

              {nextHref ? (
                <Link className={styles.pillSmall} href={nextHref}>
                  Next →
                </Link>
              ) : (
                <span className={styles.pillSmallDisabled}>Next →</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
