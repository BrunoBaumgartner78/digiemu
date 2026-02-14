import Link from "next/link";
import styles from "./page.module.css";
import { requireAdminOrRedirect } from "@/lib/guards/admin";
import { getAdminDownloads } from "@/lib/admin/downloads";
import DownloadsFilters from "@/components/admin/DownloadsFilters";

type SearchParams = Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";
export const revalidate = 0;
function spGet(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function spGetInt(sp: SearchParams, key: string, fallback: number): number {
  const raw = spGet(sp, key);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function qs(sp: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v && v.trim()) p.set(k, v.trim());
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export default async function AdminDownloadsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  await requireAdminOrRedirect();

  const sp = (searchParams || {}) as SearchParams;

  const page = spGetInt(sp, "page", 1);
  const pageSize = spGetInt(sp, "pageSize", 25);

  const from = spGet(sp, "from");
  const to = spGet(sp, "to");
  const productId = spGet(sp, "productId");
  const vendorId = spGet(sp, "vendorId");
  const buyerId = spGet(sp, "buyerId");
  const productQ = spGet(sp, "productQ");
  const vendorQ = spGet(sp, "vendorQ");
  const buyerQ = spGet(sp, "buyerQ");

  const result = await getAdminDownloads({
    page,
    pageSize,
    from,
    to,
    productId,
    vendorId,
    buyerId,
    productQ,
    vendorQ,
    buyerQ,
  });

  const baseParams: Record<string, string | undefined> = {
    from,
    to,
    productId,
    vendorId,
    buyerId,
    productQ,
    vendorQ,
    buyerQ,
    pageSize: String(pageSize),
  };

  const exportHref = `/api/admin/downloads/export${qs({
    ...baseParams,
    page: String(page),
    pageSize: "500",
  })}`;

  const prevHref = `/admin/downloads${qs({
    ...baseParams,
    page: String(Math.max(1, page - 1)),
  })}`;

  const nextHref = `/admin/downloads${qs({
    ...baseParams,
    page: String(Math.min(result.totalPages, page + 1)),
  })}`;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Admin</p>
          <h2 className={styles.h2}>Downloads</h2>
          <p className={styles.sub}>Übersicht, Filter, Export &amp; Pie</p>
        </div>

        <div className={styles.actions}>
          <Link className={styles.btn} href="/admin">
            Admin Home
          </Link>
          <a className={styles.btn} href={exportHref}>
            Export CSV
          </a>
        </div>
      </div>

      {/* ✅ Neues Filter-UI (Client Component) */}
      <div className={styles.filters}>
        <DownloadsFilters
          from={from}
          to={to}
          productId={productId}
          vendorId={vendorId}
          buyerId={buyerId}
          pageSize={pageSize}
        />
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Produkt</th>
                <th>Käufer</th>
                <th>Vendor</th>
                <th>Downloads</th>
                <th>Ablauf</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.createdAt).toLocaleString("de-CH")}</td>
                  <td className={styles.strong}>{r.productTitle}</td>
                  <td className={styles.mono}>{r.buyerEmail ?? r.buyerId}</td>
                  <td className={styles.mono}>{r.vendorEmail ?? r.vendorId}</td>
                  <td>
                    {r.downloadCount}/{r.maxDownloads === null ? "∞" : r.maxDownloads}
                  </td>
                  <td>
                    {r.expiresAt ? new Date(r.expiresAt).toLocaleString("de-CH") : "—"}
                  </td>
                </tr>
              ))}

              {result.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    Keine Einträge.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.footerRow}>
          <span className={styles.meta}>
            Total: {result.total} • Seite {result.page}/{result.totalPages}
          </span>

          <div className={styles.pager}>
            <Link className={styles.btn} href={prevHref} aria-disabled={page <= 1}>
              ← Prev
            </Link>
            <Link className={styles.btn} href={nextHref} aria-disabled={page >= result.totalPages}>
              Next →
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.statsCard}>
        <h3 className={styles.h3}>Top Produkte (nach Downloads)</h3>
        <div className={styles.pieList}>
          {result.pie.length === 0 && <p className={styles.muted}>Keine Daten.</p>}
          {result.pie.slice(0, 12).map((p) => (
            <div key={p.productId} className={styles.pieRow}>
              <span className={styles.pieCount}>{p.count}</span>
              <span className={styles.pieTitle}>{p.productTitle}</span>
              <span className={styles.pieMono}>{p.productId}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
