import Link from "next/link";
import styles from "../downloads/page.module.css";
import { prisma } from "@/lib/prisma";
import { requireAdminOrRedirect } from "@/lib/guards/admin";
import AdminActionButton from "@/components/admin/AdminActionButton";
import { parseAdminListParams, formatDateTime, formatMoney } from "@/lib/admin/adminList";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminPayoutsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdminOrRedirect();

  const sp = await searchParams;

  const { q, status, page, pageSize, from, to, buildQueryString } = parseAdminListParams(sp, {
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
      { vendor: { email: { contains: q, mode: "insensitive" } } },
      { vendor: { name: { contains: q, mode: "insensitive" } } },
      { id: { contains: q, mode: "insensitive" } },
    ];
  }

  if (status !== "all") where.status = status;

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
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
            <label className={styles.field}><span>Vendor/ID</span><input name="q" placeholder="Vendor E-Mail, Name, Payout-ID…" defaultValue={q} /></label>

            <label className={styles.field}><span>Status</span>
              <select name="status" defaultValue={status}>
                <option value="all">(alle)</option>
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="CANCELED">CANCELED</option>
              </select>
            </label>

            <label className={styles.field}><span>From</span><input name="from" placeholder="YYYY-MM-DD" defaultValue={from} /></label>
            <label className={styles.field}><span>To</span><input name="to" placeholder="YYYY-MM-DD" defaultValue={to} /></label>

            <label className={styles.field}><span>Page size</span><input name="pageSize" defaultValue={String(pageSize)} /></label>
            <input type="hidden" name="page" value="1" />
          </div>

          <div className={styles.filterButtons}><button className={styles.primaryBtn} type="submit">Filter</button><Link className={styles.secondaryBtn} href="/admin/payouts">Reset</Link></div>
        </form>

        <div className={styles.tableCard}>
          <div className={styles.tableHeader}><div>DATUM</div><div>VENDOR</div><div>STATUS</div><div>BETRAG</div><div>ACTIONS</div></div>

          {rows.length === 0 ? <div className={styles.emptyState}>Keine Payouts gefunden.</div> : (
            rows.map((p) => {
              const amountCents = Number(p.amountCents || 0);
              return (
                <div key={p.id} className={styles.tableRow}>
                  <div className={styles.monoSmall}>{formatDateTime(p.createdAt)}</div>
                  <div><div className={styles.bold}>{p.vendor?.name || p.vendor?.email || "—"}</div><div className={styles.mutedSmall}>{p.vendor?.email || "—"} • <span className={styles.monoSmall}>{p.id}</span></div></div>
                  <div><span className={styles.badge}>{p.status}</span></div>
                  <div className={styles.monoSmall}>{formatMoney(amountCents, "CHF")}<div className={styles.mutedSmall}>{p.paidAt ? `Paid: ${formatDateTime(p.paidAt)}` : "Not paid"}</div></div>

                  <div className={styles.actionsCell}>
                    {p.status === "PENDING" ? (
                      <>
                        <AdminActionButton href="/api/admin/payouts/mark-paid" method="POST" body={{ payoutId: p.id }} confirmText="Als bezahlt markieren?">Mark PAID</AdminActionButton>
                        <AdminActionButton href="/api/admin/payouts/cancel" method="POST" body={{ payoutId: p.id }} confirmText="Payout wirklich canceln?">Cancel</AdminActionButton>
                      </>
                    ) : (
                      <span className={styles.mutedSmall}>—</span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          <div className={styles.pagination}><div className={styles.mutedSmall}>Total: {total} • Seite {page}/{pageCount}</div><div className={styles.paginationBtns}>{prevHref ? <Link className={styles.pillSmall} href={prevHref}>← Prev</Link> : <span className={styles.pillSmallDisabled}>← Prev</span>}{nextHref ? <Link className={styles.pillSmall} href={nextHref}>Next →</Link> : <span className={styles.pillSmallDisabled}>Next →</span>}</div></div>
        </div>
      </div>
    </div>
  );
}
