import Link from "next/link";
import styles from "../downloads/page.module.css";
import { requireAdminOrRedirect } from "@/lib/guards/admin";
import AdminActionButton from "@/components/admin/AdminActionButton";
import ModerationNoteButton from "@/components/admin/ModerationNoteButton";
import { prisma } from "@/lib/prisma";
import {
  SearchParams,
  spGet,
  spGetInt,
  qs,
  VENDOR_STATUSES,
  normalizeEnum,
  safeDateTimeCH,
} from "@/lib/admin/adminListUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  userId: string;
  displayName: string | null;
  status: "PENDING" | "APPROVED" | "BLOCKED";
  moderationNote: string | null;
  createdAt: Date;
  isPublic: boolean;
  user: { email: string; role: "BUYER" | "VENDOR" | "ADMIN"; isBlocked: boolean };
};

export default async function AdminVendorsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  await requireAdminOrRedirect();
  const sp = (searchParams && (await searchParams)) || ({} as SearchParams);

  const page = spGetInt(sp, "page", 1, 1, 5000);
  const pageSize = spGetInt(sp, "pageSize", 25, 5, 100);
  const q = (spGet(sp, "q") ?? "").trim();
  const status = normalizeEnum(spGet(sp, "status") ?? "", VENDOR_STATUSES);

  const where: any = {};
  if (status) where.status = status;

  if (q) {
    where.OR = [
      { displayName: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const [total, rows] = await Promise.all([
    prisma.vendorProfile.count({ where }),
    prisma.vendorProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        userId: true,
        displayName: true,
        status: true,
        moderationNote: true,
        createdAt: true,
        isPublic: true,
        user: { select: { email: true, role: true, isBlocked: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const baseParams: Record<string, string | undefined> = {
    q: q || undefined,
    status: status || undefined,
    pageSize: String(pageSize),
  };

  const prevHref = `/admin/vendors${qs({ ...baseParams, page: String(Math.max(1, page - 1)) })}`;
  const nextHref = `/admin/vendors${qs({ ...baseParams, page: String(Math.min(totalPages, page + 1)) })}`;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h2 className={styles.h2}>Vendoren</h2>
          <p className={styles.sub}>Freigabe: PENDING / APPROVED / BLOCKED + Moderation Note • Aktionen werden geloggt.</p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.btn} href="/admin/products">Produkte</Link>
          <Link className={styles.btn} href="/admin/downloads">Downloads</Link>
        </div>
      </div>

      <form className={styles.filters} action="/admin/vendors" method="get">
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Suche</span>
            <input name="q" defaultValue={q} placeholder="Name oder Email…" />
          </label>

          <label className={styles.field}>
            <span>Status</span>
            <select name="status" defaultValue={status}>
              <option value="">(alle)</option>
              {VENDOR_STATUSES.map((s) => (
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
          <Link className={styles.btn} href="/admin/vendors">Reset</Link>
        </div>
      </form>

      <div className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Vendor</th>
                <th>User</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {(rows as Row[]).map((v) => {
                const statusClass =
                  v.status === "APPROVED" ? styles.badgeOk : v.status === "BLOCKED" ? styles.badgeBad : styles.badgeWarn;

                return (
                  <tr key={v.id}>
                    <td>{safeDateTimeCH(v.createdAt)}</td>
                    <td className={styles.strong}>
                      {v.displayName || "—"}
                      {v.moderationNote ? <div className={styles.noteLine}>📝 {v.moderationNote}</div> : null}
                      <div className={styles.miniMono}>VP: {v.id}</div>
                      <div className={styles.miniMono}>User: {v.userId}</div>
                    </td>
                    <td className={styles.mono}>
                      {v.user?.email ?? "—"} <span className={styles.miniMuted}>• {v.user?.role}</span>
                      {v.user?.isBlocked ? <span className={styles.miniMuted}> • blocked</span> : null}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${statusClass}`}>{v.status}</span>
                      <span className={styles.miniMuted}>{v.isPublic ? " • public" : ""}</span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <AdminActionButton
                          href={`/api/admin/vendors/${v.userId}/set-status`}
                          body={{ status: "PENDING" }}
                          className={`${styles.btn} ${styles.btnSmall}`}
                        >
                          Pending
                        </AdminActionButton>

                        <AdminActionButton
                          href={`/api/admin/vendors/${v.userId}/set-status`}
                          body={{ status: "APPROVED" }}
                          className={`${styles.btn} ${styles.btnSmall}`}
                        >
                          Approve
                        </AdminActionButton>

                        <AdminActionButton
                          href={`/api/admin/vendors/${v.userId}/set-status`}
                          body={{ status: "BLOCKED" }}
                          className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                          confirmText={`Vendor wirklich blockieren?\n\n${v.user?.email ?? v.userId}`}
                        >
                          Block
                        </AdminActionButton>

                        <ModerationNoteButton
                          href={`/api/admin/vendors/${v.userId}/set-note`}
                          current={v.moderationNote}
                          className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
                          buttonText="Note"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {(rows as Row[]).length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.empty}>Keine Vendoren.</td>
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