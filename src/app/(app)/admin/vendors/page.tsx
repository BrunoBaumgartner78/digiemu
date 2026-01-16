// src/app/admin/vendors/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminVendorListRow, AdminVendorListRowLite } from "@/lib/admin-types";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import AdminVendorStatusControls from "./AdminVendorStatusControls";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string | string[];
  status?: string | string[]; // ALL | ACTIVE | BLOCKED
  page?: string | string[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function first(v?: string | string[]) {
  return typeof v === "string" ? v : Array.isArray(v) ? v[0] ?? "" : "";
}

function buildQuery(params: { q?: string; status?: string; page?: number | string }) {
  const sp = new URLSearchParams();
  if (params.q && params.q.trim()) sp.set("q", params.q.trim());
  if (params.status && params.status.trim()) sp.set("status", params.status.trim());
  if (params.page !== undefined) sp.set("page", String(params.page));
  return sp.toString();
}

function getPageItems(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: (number | "...")[] = [];
  const c = clamp(current, 1, total);

  items.push(1);

  const left = Math.max(2, c - 1);
  const right = Math.min(total - 1, c + 1);

  if (left > 2) items.push("...");
  for (let p = left; p <= right; p++) items.push(p);
  if (right < total - 1) items.push("...");

  items.push(total);
  return items;
}

export default async function AdminVendorsPage(props: { searchParams: Promise<SearchParams> }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="neumorph-card p-6 max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Zugriff verweigert</h1>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Nur Administratoren dürfen diese Seite sehen.
          </p>
          <Link href="/admin" className="neobtn">
            Zurück zum Admin-Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const sp = await props.searchParams;

  const search = first(sp.q);
  const statusFilter = (first(sp.status) || "ALL").toUpperCase(); // ALL | ACTIVE | BLOCKED
  const pageRaw = first(sp.page) || "1";

  const pageSize = 25;
  const requestedPage = Number.parseInt(pageRaw, 10) || 1;

  const where: any = { role: "VENDOR" };

  if (search.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { email: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  // ✅ Neu: VendorStatus ist vendorProfile.status
  if (statusFilter === "ACTIVE") where.vendorProfile = { status: "APPROVED" };
  if (statusFilter === "BLOCKED") where.vendorProfile = { status: "BLOCKED" };

  const totalCount = await prisma.user.count({ where });
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = clamp(requestedPage, 1, pageCount);

  const [vendorsRaw] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      include: {
        products: {
          include: { orders: { select: { vendorEarningsCents: true } } },
        },
        vendorProfile: { select: { id: true, isPublic: true, status: true, displayName: true } },
      },
    }),
  ]);

  const vendors = vendorsRaw as unknown as AdminVendorListRowLite[];

  const hasPrev = page > 1;
  const hasNext = page < pageCount;
  const pageItems = getPageItems(page, pageCount);

  return (
    <div className="admin-shell">
      <div className="admin-breadcrumb">
        <span>Admin</span>
        <span className="admin-breadcrumb-dot" />
        <span>Vendoren</span>
      </div>

      <header className="admin-header">
        <div className="admin-kicker">DigiEmu · Admin</div>
        <h1 className="admin-title">Verkäufer (Admin)</h1>
        <p className="admin-subtitle">Alle Vendor-Accounts, mit Basisdaten & Status.</p>
      </header>

    {/* Optional: Admin kann sich selbst als Vendor bootstrappen (für Tests) */}
    <section className="mb-6">
      <form action="/api/admin/self/become-vendor" method="post">
        <button type="submit" className="neobtn-sm">
          Admin als Vendor aktivieren (Test)
        </button>
      </form>
    </section>

      {/* FILTER */}
      <section className="neumorph-card p-6 mb-6 flex flex-wrap gap-4 items-center">
        <form className="flex flex-wrap gap-4 w-full" method="get">
          <input
            name="q"
            defaultValue={search}
            placeholder="Nach Name oder E-Mail suchen…"
            className="input-neu w-full max-w-xs text-sm"
          />
          <select name="status" defaultValue={statusFilter} className="input-neu w-40 text-sm">
            <option value="ALL">Alle</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="BLOCKED">Gesperrt</option>
          </select>

          {/* bei Filtern immer zurück auf Seite 1 */}
          <input type="hidden" name="page" value="1" />

          <button type="submit" className="neobtn-sm">
            Filter anwenden
          </button>
        </form>
      </section>

      {/* TABLE */}
      <section className="neumorph-card p-6 overflow-x-auto">
        <div className="mb-3 text-xs text-[var(--text-muted)]">
          {totalCount} Vendoren · Seite {page} / {pageCount}
        </div>

        <table className="min-w-full text-sm admin-table">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left">Name / Vendor</th>
              <th className="py-2 px-3 text-left">E-Mail</th>
              <th className="py-2 px-3 text-left">Produkte</th>
              <th className="py-2 px-3 text-left">Umsatz gesamt</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-left">Aktionen</th>
              <th className="py-2 px-3 text-left">Moderation</th>
            </tr>
          </thead>

          <tbody>
              {vendors.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[var(--text-muted)]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">🧑‍💼</span>
                    <span className="font-semibold text-[var(--text-main)]">
                      Keine Verkäufer gefunden
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      Filter anpassen oder Suchbegriff ändern.
                    </span>
                  </div>
                </td>
              </tr>
              ) : (
              vendors.map((v) => {
                const revenueCents = v.products.reduce((sumP, p) => {
                  const productSum = p.orders.reduce((sumO, o) => sumO + (o.vendorEarningsCents ?? 0), 0);
                  return sumP + productSum;
                }, 0);

                const derivedStatus = v.vendorProfile?.status ?? (v.isBlocked ? "BLOCKED" : "PENDING");

                return (
                  <tr key={v.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 px-3 font-medium text-[var(--text-main)]">
                      {v.name || "—"}
                    </td>
                    <td className="py-2 px-3">{v.email}</td>
                    <td className="py-2 px-3">{v.products?.length ?? 0}</td>
                    <td className="py-2 px-3">{(revenueCents / 100).toFixed(2)} CHF</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          derivedStatus === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-500"
                        }`}
                      >
                        {derivedStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 flex flex-wrap gap-2">
                      <Link href={`/admin/vendors/${v.id}`} className="neobtn-sm">
                        Vendor-Ansicht
                      </Link>
                      <Link href={`/admin/payouts/vendor/${v.id}`} className="neobtn-sm ghost">
                        Payouts
                      </Link>
                      {v.vendorProfile ? null : (
                        <span className="text-xs text-[var(--text-muted)]">Kein Profil</span>
                      )}
                  {/* ✅ Approve/Block direkt in Liste */}
                  {derivedStatus !== "APPROVED" && (
                    <form action={`/api/admin/vendors/${v.id}/approve`} method="post">
                      <button type="submit" className="neobtn-sm">
                        Freischalten
                      </button>
                    </form>
                  )}
                  {derivedStatus !== "BLOCKED" && (
                    <form action={`/api/admin/vendors/${v.id}/block`} method="post">
                      <button type="submit" className="neobtn-sm ghost">
                        Sperren
                      </button>
                    </form>
                  )}
                    </td>
                    <td className="py-2 px-3">
                      <AdminVendorStatusControls
                        userId={v.id}
                        initialIsPublic={v.vendorProfile?.isPublic ?? false}
                        initialStatus={v.vendorProfile?.status ?? "PENDING"}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        {pageCount > 1 && (
          <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-[var(--text-muted)]">
              Seite {page} / {pageCount} · {totalCount} Vendoren
            </div>

            <div className="flex items-center gap-2">
              {hasPrev ? (
                <Link
                  className="neobtn-sm ghost"
                  href={`/admin/vendors?${buildQuery({ q: search, status: statusFilter, page: page - 1 })}`}
                >
                  ← Zurück
                </Link>
              ) : (
                <span className="neobtn-sm ghost opacity-40 pointer-events-none">← Zurück</span>
              )}

              <div className="flex items-center gap-1">
                {pageItems.map((it, idx) =>
                  it === "..." ? (
                    <span key={`dots-${idx}`} className="px-2 text-[var(--text-muted)]">
                      …
                    </span>
                  ) : (
                    <Link
                      key={it}
                      href={`/admin/vendors?${buildQuery({ q: search, status: statusFilter, page: it })}`}
                      className={`px-3 py-1 rounded-full border text-xs ${
                        it === page
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                          : "bg-[var(--neo-card-bg-soft)] text-[var(--text-main)] border-[var(--neo-card-border)]"
                      }`}
                    >
                      {it}
                    </Link>
                  )
                )}
              </div>

              {hasNext ? (
                <Link
                  className="neobtn-sm ghost"
                  href={`/admin/vendors?${buildQuery({ q: search, status: statusFilter, page: page + 1 })}`}
                >
                  Weiter →
                </Link>
              ) : (
                <span className="neobtn-sm ghost opacity-40 pointer-events-none">Weiter →</span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
