import Link from "next/link";
import styles from "../downloads/page.module.css";
import { prisma } from "@/lib/prisma";
import { requireAdminOrRedirect } from "@/lib/guards/admin";
import AdminActionButton from "@/components/admin/AdminActionButton";
import { parseAdminListParams, formatDateTime, formatMoneyFromCents } from "@/lib/admin/adminList";
import type { Prisma } from "@prisma/client";

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

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  await requireAdminOrRedirect();

  const sp = await Promise.resolve(searchParams ?? {});

  const parsed = parseAdminListParams(sp, {
    q: { key: "q", default: "" },
    status: { key: "status", default: "all" },
    page: { key: "page", default: 1 },
    pageSize: { key: "pageSize", default: 25, min: 5, max: 200 },
    from: { key: "from", default: "" },
    to: { key: "to", default: "" },
  }) as AdminListParsed;

  const q = (parsed.q ?? "").trim();
  const status = parsed.status ?? "all";
  const page = Number(parsed.page) || 1;
  const pageSize = Number(parsed.pageSize) || 25;
  const from = (parsed.from ?? "").trim();
  const to = (parsed.to ?? "").trim();
  const buildQueryString = parsed.buildQueryString;

  const where: Prisma.PayoutWhereInput = {};

  if (q) {
    where.OR = [
      { vendor: { email: { contains: q, mode: "insensitive" } } },
      { vendor: { name: { contains: q, mode: "insensitive" } } },
      { id: { contains: q, mode: "insensitive" } },
    ];
  }

  if (status !== "all") {
    where.status = status as unknown as Prisma.PayoutWhereInput["status"];
  }

  if (from || to) {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    const fromOk = !!fromDate && !Number.isNaN(fromDate.getTime());
    const toOk = !!toDate && !Number.isNaN(toDate.getTime());

    if (fromOk || toOk) {
      where.createdAt = {
        ...(fromOk ? { gte: fromDate as Date } : {}),
        ...(toOk ? { lte: toDate as Date } : {}),
      };
    }
  }

  const skip = (page - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.payout.count({ where }),
    prisma.payout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        status: true,
        amountCents: true,
        createdAt: true,
        paidAt: true,
        vendor: { select: { id: true, email: true, name: true } },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const prevHref = page > 1 ? `?${buildQueryString({ page: String(page - 1) })}` : null;
  const nextHref = page < pageCount ? `?${buildQueryString({ page: String(page + 1) })}` : null;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>ADMIN</p>
          <h1 className={styles.title}>Payouts</h1>
          <p className={styles.subtitle}>Payout-Liste, Filter, Status auf PAID setzen, Export.</p>
        </div>

        <div className={styles.actionsRow}>
          <Link className={styles.pill} href="/admin/downloads">Downloads</Link>
          <a className={styles.pill} href="/api/admin/payouts/export">Export CSV</a>
        </div>

        <form className={styles.filtersCard} method="GET">
          <div className={styles.filtersGrid}>
            <label className={styles.field}>
              <span>Vendor/ID</span>
              <input name="q" placeholder="Vendor E-Mail, Name, Payout-ID…" defaultValue={q} />
            </label>

            <label className={styles.field}>
              <span>Status</span>
              <select name="status" defaultValue={status}>
                <option value="all">(alle)</option>
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
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
            <button className={styles.primaryBtn} type="submit">Filter</button>
            <Link className={styles.secondaryBtn} href="/admin/payouts">Reset</Link>
          </div>
        </form>

        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div>DATUM</div>
            <div>VENDOR</div>
            <div>STATUS</div>
            <div>BETRAG</div>
            <div>ACTIONS</div>
          </div>

          {rows.length === 0 ? (
            <div className={styles.emptyState}>Keine Payouts gefunden.</div>
          ) : (
            rows.map((p) => (
              <div key={p.id} className={styles.tableRow}>
                <div className={styles.monoSmall}>{formatDateTime(p.createdAt)}</div>

                <div>
                  <div className={styles.bold}>{p.vendor?.name || p.vendor?.email || "—"}</div>
                  <div className={styles.mutedSmall}>
                    {p.vendor?.email || "—"} • <span className={styles.monoSmall}>{p.id}</span>
                  </div>
                </div>

                <div><span className={styles.badge}>{p.status}</span></div>

                <div className={styles.monoSmall}>
                  {formatMoneyFromCents(Number(p.amountCents || 0), "CHF")}
                  <div className={styles.mutedSmall}>
                    {p.paidAt ? `Paid: ${formatDateTime(p.paidAt)}` : "Not paid"}
                  </div>
                </div>

                <div className={styles.actionsCell}>
                  {p.status === "PENDING" ? (
                    <>
                      <AdminActionButton
                        href="/api/admin/payouts/mark-paid"
                        method="POST"
                        body={{ payoutId: p.id }}
                        confirmText="Als bezahlt markieren?"
                        className={styles.pillSmall}
                      >
                        Mark PAID
                      </AdminActionButton>

                      <AdminActionButton
                        href="/api/admin/payouts/cancel"
                        method="POST"
                        body={{ payoutId: p.id }}
                        confirmText="Payout wirklich canceln?"
                        className={styles.pillSmall}
                      >
                        Cancel
                      </AdminActionButton>
                    </>
                  ) : (
                    <span className={styles.mutedSmall}>—</span>
                  )}
                </div>
              </div>
            ))
          )}

          <div className={styles.pagination}>
            <div className={styles.mutedSmall}>
              Total: {total} • Seite {page}/{pageCount}
            </div>

            <div className={styles.paginationBtns}>
              {prevHref ? (
                <Link className={styles.pillSmall} href={prevHref}>← Prev</Link>
              ) : (
                <span className={styles.pillSmallDisabled}>← Prev</span>
              )}

              {nextHref ? (
                <Link className={styles.pillSmall} href={nextHref}>Next →</Link>
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
