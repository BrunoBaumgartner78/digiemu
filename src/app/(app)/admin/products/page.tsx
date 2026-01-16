
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { AdminProductListRow } from "@/lib/admin-types";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import AdminProductStatusToggle from "./AdminProductStatusToggle";
import { getMarketplaceVisibilityDebug } from "@/lib/marketplace-visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminProductsSearchParams = {
  q?: string | string[];
  vendor?: string | string[];
  status?: string | string[];
  page?: string | string[];
};

type Props = {
  searchParams?: Promise<AdminProductsSearchParams>;
};

function first(v?: string | string[]) {
  return typeof v === "string" ? v : Array.isArray(v) ? v[0] ?? "" : "";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildQuery(params: { q?: string; vendor?: string; status?: string; page?: number | string }) {
  const sp = new URLSearchParams();
  if (params.q && params.q.trim()) sp.set("q", params.q.trim());
  if (params.vendor && params.vendor.trim()) sp.set("vendor", params.vendor.trim());
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

export default async function AdminProductsPage(props: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as { role?: string };
  if (user.role !== "ADMIN") redirect("/dashboard");

  const sp = props.searchParams ? await props.searchParams : {};

  const search = first(sp.q);
  const vendorFilter = first(sp.vendor);
  const statusFilter = first(sp.status);
  const pageRaw = first(sp.page) || "1";

  const requestedPage = parseInt(pageRaw, 10) || 1;
  const pageSize = 20;

  const where: Prisma.ProductWhereInput = {};

  if (search.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  if (vendorFilter.trim()) where.vendorId = vendorFilter.trim();
  if (statusFilter === "ACTIVE") where.status = "ACTIVE";
  if (statusFilter === "DRAFT") where.status = "DRAFT";
  if (statusFilter === "BLOCKED") where.status = "BLOCKED";

  const totalProducts = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const page = clamp(requestedPage, 1, totalPages);

  const [productsRaw, vendorProfiles] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        vendor: { select: { id: true, email: true, isBlocked: true } },
        vendorProfile: { select: { id: true, userId: true, status: true, isPublic: true } },
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

    const products = productsRaw as AdminProductListRow[];

    const hasPrev = page > 1;
    const hasNext = page < totalPages;
    const pageItems = getPageItems(page, totalPages);

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
        <section className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-4 md:p-6">
          <form className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between" method="GET">
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

              <input type="hidden" name="page" value="1" />
              <button type="submit" className="neobtn-sm">Filtern</button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-4 md:p-6 overflow-x-auto">
          <div className="mb-3 text-xs text-[var(--text-muted)]">
            {totalProducts} Produkte gefunden · Seite {page} / {totalPages}
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
                products.map((p) => {
                  const vis = getMarketplaceVisibilityDebug(p);

                  return (
                    <tr
                      key={p.id}
                      className="border-t border-[var(--neo-card-border)] hover:bg-[rgba(148,163,184,0.08)] transition-colors"
                    >
                      <td className="py-2 px-3 font-medium text-[var(--text-main)]">
                        {p.title}
                        {p.description ? (
                          <div className="text-[var(--text-muted)] text-xs line-clamp-2">{p.description}</div>
                        ) : null}
                      </td>

                      <td className="py-2 px-3 text-[var(--text-main)]">
                        {p.vendor?.email ?? "Unbekannt"}
                        {p.vendor?.isBlocked ? <div className="text-xs text-rose-300 mt-1">Vendor gesperrt</div> : null}
                        {p.vendorProfile ? (
                          <div className="text-xs text-[var(--text-muted)] mt-1">
                            Profile: {String(p.vendorProfile.status)} · {p.vendorProfile.isPublic ? "public" : "private"}
                          </div>
                        ) : null}
                      </td>

                      <td className="py-2 px-3 text-[var(--text-main)]">
                        {typeof p.priceCents === "number" ? (p.priceCents / 100).toFixed(2) + " CHF" : "–"}
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

                        <div className="mt-2 text-xs text-[var(--text-muted)]">
                          Marketplace: {vis.isVisible ? "sichtbar" : "nicht sichtbar"}
                          {!vis.isVisible && vis.reasons.length ? ` · Gründe: ${vis.reasons.join(", ")}` : null}
                        </div>
                      </td>

                      <td className="py-2 px-3 text-[var(--text-muted)] text-xs">
                        {new Date(p.createdAt).toLocaleDateString("de-CH")}
                      </td>

                      <td className="py-2 px-3 text-right">
                        <div className="flex justify-end gap-2 items-center flex-wrap">
                          <span className="text-xs text-[var(--text-muted)]">
                            {p._count?.orders ?? 0} Bestellungen
                          </span>

                          <AdminProductStatusToggle
                            productId={p.id}
                            initialStatus={p.status}
                            initialIsActive={!!p.isActive}
                          />

                          <Link href={`/admin/products/edit/${p.id}`} className="neobtn-sm">
                            Bearbeiten
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-[var(--text-muted)]">Seite {page} / {totalPages}</div>

              <div className="flex items-center gap-2">
                {hasPrev ? (
                  <Link
                    className="neobtn-sm"
                    href={`/admin/products?${buildQuery({ q: search, vendor: vendorFilter, status: statusFilter, page: page - 1 })}`}
                  >
                    ← Zurück
                  </Link>
                ) : (
                  <span className="neobtn-sm opacity-40 pointer-events-none">← Zurück</span>
                )}

                <div className="flex items-center gap-1">
                  {pageItems.map((it, idx) =>
                    it === "..." ? (
                      <span key={`dots-${idx}`} className="px-2 text-[var(--text-muted)]">…</span>
                    ) : (
                      <Link
                        key={it}
                        href={`/admin/products?${buildQuery({ q: search, vendor: vendorFilter, status: statusFilter, page: it })}`}
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
                    className="neobtn-sm"
                    href={`/admin/products?${buildQuery({ q: search, vendor: vendorFilter, status: statusFilter, page: page + 1 })}`}
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
