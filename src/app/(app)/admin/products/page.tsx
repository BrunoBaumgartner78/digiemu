
import Link from "next/link";
import styles from "../downloads/page.module.css";
import { requireAdminOrRedirect } from "@/lib/guards/admin";
import AdminActionButton from "@/components/admin/AdminActionButton";
import ModerationNoteButton from "@/components/admin/ModerationNoteButton";
import { prisma } from "@/lib/prisma";
import { PRODUCT_STATUSES } from "@/lib/admin/adminListUtils";
import { qs, spGet, spGetEnum, spGetInt, safeDateTimeCH, formatCHF, type SearchParams } from "@/lib/admin/listUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  priceCents: number;
  status: "DRAFT" | "ACTIVE" | "BLOCKED";
  isActive: boolean;
  moderationNote: string | null;
  createdAt: Date;
  vendorId: string;
  vendor: { email: string } | null;
};

export default async function AdminProductsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  await requireAdminOrRedirect();
  const sp = (searchParams && (await searchParams)) || ({} as SearchParams);

  const ALLOWED_STATUS = new Set(["DRAFT", "ACTIVE", "BLOCKED"]);
  const page = spGetInt(sp, "page", 1, 1, 10_000);
  const pageSize = spGetInt(sp, "pageSize", 25, 5, 100);
  const q = (spGet(sp, "q") ?? "").trim();
  const status = spGetEnum(sp, "status", ALLOWED_STATUS);

  const where: Record<string, unknown> = {};
  if (status) (where as any).status = status;

  if (q) {
    (where as any).OR = [
      { title: { contains: q, mode: "insensitive" } },
      { vendor: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const skip = (page - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        priceCents: true,
        status: true,
        isActive: true,
        moderationNote: true,
        createdAt: true,
        vendorId: true,
        vendor: { select: { email: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const baseParams: Record<string, string | undefined> = {
    q: q || undefined,
    status: status || undefined,
    pageSize: String(pageSize),
  };

  const prevHref = `/admin/products${qs({ ...baseParams, page: String(Math.max(1, page - 1)) })}`;
  const nextHref = `/admin/products${qs({ ...baseParams, page: String(Math.min(totalPages, page + 1)) })}`;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h2 className={styles.h2}>Produkte</h2>
          <p className={styles.sub}>Kuratierung: DRAFT / ACTIVE / BLOCKED + Moderation Note • Aktionen werden geloggt.</p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.btn} href="/admin/vendors">Vendoren</Link>
          <Link className={styles.btn} href="/admin/downloads">Downloads</Link>
        </div>
      </div>

      <form className={styles.filters} action="/admin/products" method="get">
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Suche</span>
            <input name="q" defaultValue={q} placeholder="Titel oder Vendor-Email…" />
          </label>

          <label className={styles.field}>
            <span>Status</span>
            <select name="status" defaultValue={status}>
              <option value="">(alle)</option>
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Page size</span>
            <input name="pageSize" defaultValue={String(pageSize)} />
          </label>
        </div>

        <div className={styles.filterActions}>
          <button className={styles.btn} type="submit">Filter</button>
          <Link className={styles.btn} href="/admin/products">Reset</Link>
        </div>
      </form>

      <div className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Produkt</th>
                <th>Preis</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((p: Row) => {
                const statusClass =
                  p.status === "ACTIVE" ? styles.badgeOk : p.status === "BLOCKED" ? styles.badgeBad : styles.badgeWarn;

                return (
                  <tr key={p.id}>
                    <td>{safeDateTimeCH(p.createdAt.toISOString())}</td>
                    <td className={styles.strong}>
                      {p.title}
                      {p.moderationNote ? <div className={styles.noteLine}>📝 {p.moderationNote}</div> : null}
                      <div className={styles.miniMono}>{p.id}</div>
                    </td>
                    <td className={styles.mono}>{formatCHF(p.priceCents)}</td>
                    <td className={styles.mono}>{p.vendor?.email ?? p.vendorId}</td>
                    <td>
                      <span className={`${styles.badge} ${statusClass}`}>{p.status}</span>
                      <span className={styles.miniMuted}> {p.isActive ? "• active" : ""}</span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <AdminActionButton
                          href={`/api/admin/products/${p.id}/set-status`}
                          body={{ status: "DRAFT" }}
                          className={`${styles.btn} ${styles.btnSmall}`}
                        >
                          Draft
                        </AdminActionButton>

                        <AdminActionButton
                          href={`/api/admin/products/${p.id}/set-status`}
                          body={{ status: "ACTIVE" }}
                          className={`${styles.btn} ${styles.btnSmall}`}
                        >
                          Activate
                        </AdminActionButton>

                        <AdminActionButton
                          href={`/api/admin/products/${p.id}/set-status`}
                          body={{ status: "BLOCKED" }}
                          className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                          confirmText={`Produkt wirklich blockieren?\n\n${p.title}`}
                        >
                          Block
                        </AdminActionButton>

                        <ModerationNoteButton
                          href={`/api/admin/products/${p.id}/set-note`}
                          current={p.moderationNote}
                          className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
                          label="Note"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>Keine Produkte.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.footerRow}>
          <span className={styles.meta}>
            Total: {total} • Seite {page}/{totalPages}
          </span>
          <div className={styles.pager}>
            <Link className={styles.btn} href={prevHref} aria-disabled={page <= 1}>← Prev</Link>
            <Link className={styles.btn} href={nextHref} aria-disabled={page >= totalPages}>Next →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}