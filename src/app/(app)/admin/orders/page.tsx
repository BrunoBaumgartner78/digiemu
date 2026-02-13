import Link from "next/link";
import styles from "../downloads/page.module.css";
import { prisma } from "@/lib/prisma";
import { requireAdminOrRedirect } from "@/lib/guards/admin";
import {
  parseAdminListParams,
  formatDateTime,
  formatMoneyFromCents,
} from "@/lib/admin/adminList";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type AdminListParsed = {
  q: string;
  status: string;
  page: number;
  pageSize: number;
  from: string;
  to: string;
  buildQueryString: (patch?: Record<string, string | undefined>) => string;
};

type OrderRow = Prisma.OrderGetPayload<{
  include: {
    buyer: { select: { id: true; email: true; name: true } };
    product: { select: { id: true; title: true; priceCents: true } };
    downloadLink: { select: { id: true; expiresAt: true; createdAt: true } };
  };
}>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  await requireAdminOrRedirect();

  const sp = searchParams ?? {};

  const { q, status, page, pageSize, from, to, buildQueryString } =
    parseAdminListParams(sp, {
      q: { key: "q", default: "" },
      status: { key: "status", default: "all" },
      page: { key: "page", default: 1 },
      pageSize: { key: "pageSize", default: 25, min: 5, max: 200 },
      from: { key: "from", default: "" },
      to: { key: "to", default: "" },
    }) as AdminListParsed;

  const where: Prisma.OrderWhereInput = {};

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
    // If your enum differs, keep it as string cast to satisfy TS without `any`
    where.status = status as unknown as Prisma.OrderWhereInput["status"];
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
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
        product: { select: { id: true, title: true, priceCents: true } },
        downloadLink: { select: { id: true, expiresAt: true, createdAt: true } },
      },
    }) as Promise<OrderRow[]>,
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
            rows.map((ord) => {
              const orderCents = Number((ord.amountCents ?? 0) as unknown);
              const productCents = Number(ord.product?.priceCents ?? 0);
              const amountCents = orderCents >= 50 ? orderCents : productCents;

              return (
                <div key={ord.id} className={styles.tableRow}>
                  <div className={styles.monoSmall}>{formatDateTime(ord.createdAt)}</div>

                  <div>
                    <div className={styles.bold}>
                      {ord.buyer?.name || ord.buyer?.email || "—"}
                    </div>
                    <div className={styles.mutedSmall}>
                      {ord.buyer?.email || "—"} • {" "}
                      <span className={styles.monoSmall}>{ord.id}</span>
                    </div>
                  </div>

                  <div>
                    <div className={styles.bold}>{ord.product?.title || "—"}</div>
                    <div className={styles.mutedSmall}>
                      {ord.product?.id ? (
                        <span className={styles.monoSmall}>{ord.product.id}</span>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={styles.badge}>{String(ord.status ?? "")}</span>
                    {ord.stripeSessionId ? (
                      <div className={styles.mutedSmall}>
                        <span className={styles.monoSmall}>{ord.stripeSessionId}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.monoSmall}>
                    {formatMoneyFromCents(amountCents, "CHF")}
                  </div>

                  <div className={styles.actionsCell}>
                    <a className={styles.pillSmall} href={`/download/${ord.id}`}>
                      View
                    </a>

                    <a
                      className={styles.pillSmall}
                      href={`/api/admin/orders/export?orderId=${encodeURIComponent(ord.id)}`}
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
