// src/app/admin/products/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type AdminProductsSearchParams = {
  q?: string;
  vendor?: string; // userId des Vendors
  status?: string;
  page?: string; // "1", "2", ...
};

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

type AdminProductsPageProps = {
  searchParams?: SP;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildQuery(params: {
  q?: string;
  vendor?: string;
  status?: string;
  page?: number | string;
}) {
  const sp = new URLSearchParams();

  if (params.q && params.q.trim().length > 0) sp.set("q", params.q.trim());
  if (params.vendor && params.vendor.trim().length > 0) sp.set("vendor", params.vendor.trim());
  if (params.status && params.status.trim().length > 0) sp.set("status", params.status.trim());
  if (params.page !== undefined) sp.set("page", String(params.page));

  return sp.toString();
}

function getPageItems(current: number, total: number) {
  // max ~7 Buttons, mit "…"
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

// Option B: Debug-Logger (nur wenn explizit via Env-Flag aktiviert)
const isDebug = process.env.DEBUG_ADMIN_PRODUCTS === "1";
const dbg = (...args: any[]) => {
  if (isDebug) console.log(...args);
};

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  dbg("ADMIN_PRODUCTS_RENDER", new Date().toISOString(), { searchParams });

  // Auth / Role check
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "ADMIN") redirect("/dashboard");

  const resolved = await Promise.resolve(searchParams ?? {});

  const search = (first(resolved.q) ?? "").toString();
  const vendorFilter = (first(resolved.vendor) ?? "").toString();
  const statusFilter = (first(resolved.status) ?? "").toString();

  const requestedPage = parseInt((first(resolved.page) ?? "1").toString(), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const pageSize = 20;

  // Where bauen
  const where: any = {};

  if (search.trim().length > 0) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  if (vendorFilter.trim().length > 0) {
    where.vendorId = vendorFilter.trim();
  }

  if (statusFilter.trim().length > 0) {
    // Wenn status ein Prisma-Enum ist: where.status = statusFilter.trim()
    // (Kein "mode" bei equals)
    where.status = statusFilter.trim();
  }

  dbg("ADMIN_PRODUCTS_FILTER", { search, vendorFilter, statusFilter, where });

  // total zuerst -> totalPages berechnen
  const totalProducts = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const safePage = clamp(page, 1, totalPages);

  // Daten für safePage laden
  const [products, vendorProfiles] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: {
        vendor: { select: { id: true, email: true, isBlocked: true } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.vendorProfile.findMany({
      select: {
        id: true,
        userId: true,
        displayName: true,
        user: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;
  const pageItems = getPageItems(safePage, totalPages);

  return (
    <div className="admin-shell">
      <div className="admin-breadcrumb">
        <span>Admin</span>
        <span className="admin-breadcrumb-dot" />
        <span>Produkte</span>
      </div>

      <header className="admin-header">
        <div className="admin-kicker">DigiEmu · Admin</div>
        <h1 className="admin-title">Admin – Produkte</h1>
        <p className="admin-subtitle">Übersicht über alle Produkte auf der Plattform.</p>
      </header>

      <div className="space-y-6">
        {/* FILTER */}
        <section className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-4 md:p-6">
          <form
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            method="GET"
          >
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={search}
                placeholder="Suche nach Titel oder Beschreibung…"
                className="w-full input-neu"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select name="vendor" defaultValue={vendorFilter} className="input-neu w-44">
                <option value="">Alle Vendoren</option>
                {vendorProfiles.map((v) => (
                  <option key={v.id} value={v.userId}>
                    {v.displayName ?? v.user?.email ?? v.userId.slice(0, 8) + "…"}
                  </option>
                ))}
              </select>

              <select name="status" defaultValue={statusFilter} className="input-neu w-40">
                <option value="">Status: alle</option>
                <option value="ACTIVE">Aktiv</option>
                <option value="DRAFT">Draft</option>
                <option value="BLOCKED">Gesperrt</option>
              </select>

              {/* bei Filter immer auf Seite 1 */}
              <input type="hidden" name="page" value="1" />

              <button type="submit" className="neobtn-sm">
                Filtern
              </button>
            </div>
          </form>
        </section>

        {/* TABLE */}
        <section className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-4 md:p-6 overflow-x-auto">
          <div className="mb-3 text-xs text-[var(--text-muted)]">
            {totalProducts} Produkte gefunden · Seite {safePage} / {totalPages}
          </div>

          <table className="min-w-full text-sm admin-table">
            <thead>
              <tr>
                <th className="py-2 px-3 text-left">Titel</th>
                <th className="py-2 px-3 text-left">Vendor</th>
                <th className="py-2 px-3 text-left">Preis</th>
                <th className="py-2 px-3 text-left">Status</th>
                <th className="py-2 px-3 text-left">Erstellt</th>
                <th className="py-2 px-3 text-right">Aktionen</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[var(--text-muted)] text-sm">
                    Keine Produkte gefunden.
                  </td>
                </tr>
              ) : (
                products.map((p: any) => (
                  <tr
                    key={p.id}
                    className="border-t border-[var(--neo-card-border)] hover:bg-[rgba(148,163,184,0.08)] transition-colors"
                  >
                    <td className="py-2 px-3 font-medium text-[var(--text-main)]">
                      {p.title}
                      {p.description && (
                        <div className="text-[var(--text-muted)] text-xs line-clamp-2">
                          {p.description}
                        </div>
                      )}
                    </td>

                    <td className="py-2 px-3 text-[var(--text-main)]">
                      {p.vendor?.email ?? "Unbekannt"}
                      {p.vendor?.isBlocked ? (
                        <div className="text-xs text-rose-300 mt-1">Vendor gesperrt</div>
                      ) : null}
                    </td>

                    <td className="py-2 px-3 text-[var(--text-main)]">
                      {typeof p.priceCents === "number"
                        ? (p.priceCents / 100).toFixed(2) + " CHF"
                        : "–"}
                    </td>

                    <td className="py-2 px-3">
                      {p.status === "ACTIVE" && (
                        <span className="inline-flex rounded-full bg-emerald-500/10 text-emerald-500 px-3 py-0.5 text-xs font-medium">
                          Aktiv
                        </span>
                      )}
                      {p.status === "DRAFT" && (
                        <span className="inline-flex rounded-full bg-slate-500/10 text-slate-300 px-3 py-0.5 text-xs font-medium">
                          Draft
                        </span>
                      )}
                      {p.status === "BLOCKED" && (
                        <span className="inline-flex rounded-full bg-rose-500/10 text-rose-400 px-3 py-0.5 text-xs font-medium">
                          Gesperrt
                        </span>
                      )}
                    </td>

                    <td className="py-2 px-3 text-[var(--text-muted)] text-xs">
                      {new Date(p.createdAt).toLocaleDateString("de-CH")}
                    </td>

                    <td className="py-2 px-3 text-right">
                      <div className="flex justify-end gap-2 items-center flex-wrap">
                        <span className="text-xs text-[var(--text-muted)]">
                          {p._count?.orders ?? 0} Bestellungen
                        </span>

                        <Link href={`/admin/products/edit/${p.id}`} className="neobtn-sm">
                          Bearbeiten
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-[var(--text-muted)]">
                Seite {safePage} / {totalPages}
              </div>

              <div className="flex items-center gap-2">
                {hasPrev ? (
                  <Link
                    className="neobtn-sm"
                    href={`/admin/products?${buildQuery({
                      q: search,
                      vendor: vendorFilter,
                      status: statusFilter,
                      page: safePage - 1,
                    })}`}
                  >
                    ← Zurück
                  </Link>
                ) : (
                  <span className="neobtn-sm opacity-40 pointer-events-none">← Zurück</span>
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
                        href={`/admin/products?${buildQuery({
                          q: search,
                          vendor: vendorFilter,
                          status: statusFilter,
                          page: it,
                        })}`}
                        className={`px-3 py-1 rounded-full border text-xs ${
                          it === safePage
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
                    className="neobtn-sm"
                    href={`/admin/products?${buildQuery({
                      q: search,
                      vendor: vendorFilter,
                      status: statusFilter,
                      page: safePage + 1,
                    })}`}
                  >
                    Weiter →
                  </Link>
                ) : (
                  <span className="neobtn-sm opacity-40 pointer-events-none">Weiter →</span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
