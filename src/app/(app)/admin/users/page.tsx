import Link from "next/link";
import styles from "../downloads/page.module.css";
import { prisma } from "@/lib/prisma";
import { requireAdminOrRedirect } from "@/lib/guards/admin";
import AdminActionButton from "@/components/admin/AdminActionButton";
import { parseAdminListParams, formatDateTime } from "@/lib/admin/adminList";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
type PageProps = { searchParams?: SearchParams };

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdminOrRedirect();

  const sp = searchParams ?? {};

  const { q, status, page, pageSize, buildQueryString } = parseAdminListParams(sp, {
    q: { key: "q", default: "" },
    status: { key: "status", default: "all" },
    page: { key: "page", default: 1 },
    pageSize: { key: "pageSize", default: 25, min: 5, max: 200 },
  });

  const where: {
    OR?: Array<
      | { id: { contains: string; mode: "insensitive" } }
      | { email: { contains: string; mode: "insensitive" } }
      | { name: { contains: string; mode: "insensitive" } }
    >;
    isBlocked?: boolean;
    role?: "ADMIN" | "VENDOR" | "BUYER";
  } = {};

  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  if (status !== "all") {
    if (status === "blocked") where.isBlocked = true;
    else if (status === "unblocked") where.isBlocked = false;
    else if (status === "ADMIN" || status === "VENDOR" || status === "BUYER") where.role = status;
  }

  const skip = (page - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: { id: true, email: true, name: true, role: true, isBlocked: true, createdAt: true },
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
          <h1 className={styles.title}>User</h1>
          <p className={styles.subtitle}>User-Liste, Rollen, Sperren/Entsperren. (AuditLog als nächster Schritt.)</p>
        </div>

        <div className={styles.actionsRow}>
          <Link className={styles.pill} href="/admin/downloads">
            Downloads
          </Link>

          {/* Next.js rule: no raw <a> for internal navigation */}
          <Link className={styles.pill} href="/api/admin/users/export">
            Export CSV
          </Link>
        </div>

        <form className={styles.filtersCard} method="GET">
          <div className={styles.filtersGrid}>
            <label className={styles.field}>
              <span>Suche</span>
              <input name="q" placeholder="Name, E-Mail, ID…" defaultValue={q} />
            </label>

            <label className={styles.field}>
              <span>Filter</span>
              <select name="status" defaultValue={status}>
                <option value="all">(alle)</option>
                <option value="ADMIN">ADMIN</option>
                <option value="VENDOR">VENDOR</option>
                <option value="BUYER">BUYER</option>
                <option value="blocked">blocked</option>
                <option value="unblocked">unblocked</option>
              </select>
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
            <Link className={styles.secondaryBtn} href="/admin/users">
              Reset
            </Link>
          </div>
        </form>

        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div>DATUM</div>
            <div>USER</div>
            <div>ROLE</div>
            <div>STATUS</div>
            <div>ACTIONS</div>
          </div>

          {rows.length === 0 ? (
            <div className={styles.emptyState}>Keine User gefunden.</div>
          ) : (
            rows.map((u) => (
              <div key={u.id} className={styles.tableRow}>
                <div className={styles.monoSmall}>{formatDateTime(u.createdAt)}</div>

                <div>
                  <div className={styles.bold}>{u.name || u.email}</div>
                  <div className={styles.mutedSmall}>
                    {u.email} • <span className={styles.monoSmall}>{u.id}</span>
                  </div>
                </div>

                <div>
                  <span className={styles.badge}>{u.role}</span>
                </div>

                <div>
                  <span className={u.isBlocked ? styles.badgeDanger : styles.badgeOk}>
                    {u.isBlocked ? "BLOCKED" : "ACTIVE"}
                  </span>
                </div>

                <div className={styles.actionsCell}>
                  <AdminActionButton
                    href="/api/admin/users/toggle-block"
                    method="POST"
                    body={{ userId: u.id }}
                    confirmText={u.isBlocked ? null : "User wirklich sperren?"}
                  >
                    {u.isBlocked ? "Unblock" : "Block"}
                  </AdminActionButton>
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
