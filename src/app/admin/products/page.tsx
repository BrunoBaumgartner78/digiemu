// src/app/admin/products/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

type AdminProductsSearchParams = {
  q?: string;
  vendor?: string;
  status?: string;
  page?: string;
};

type AdminProductsPageProps = {
  searchParams: Promise<AdminProductsSearchParams>;
};

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  // --- Auth / Role check ----------------------------------------------------
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // --- Search params (async!) -----------------------------------------------
  const resolved = await searchParams;
  const search = resolved.q ?? "";
  const vendorFilter = resolved.vendor ?? undefined;
  const statusFilter = resolved.status ?? undefined;
  const page = parseInt(resolved.page ?? "1", 10) || 1;
  const pageSize = 20;

  // --- Where-Clause bauen ----------------------------------------------------
  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (vendorFilter) {
    where.vendorId = vendorFilter;
  }

  if (statusFilter === "ACTIVE") {
    where.isActive = true;
  } else if (statusFilter === "INACTIVE") {
    where.isActive = false;
  }

  // --- Daten laden ----------------------------------------------------------
  const [totalProducts, products, vendors] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        vendor: {
          select: { id: true, email: true },
        },
      },
    }),
    prisma.vendorProfile.findMany({
      select: { id: true, displayName: true, user: { select: { email: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));

  // --- JSX -------------------------------------------------------------------
  return (
    <div className="admin-shell">
      {/* Breadcrumb + Header */}
      <div className="admin-breadcrumb">
        <span>Admin</span>
        <span className="admin-breadcrumb-dot" />
        <span>Produkte</span>
      </div>

      <header className="admin-header">
        <div className="admin-kicker">DigiEmu · Admin</div>
        <h1 className="admin-title">Admin – Produkte</h1>
        <p className="admin-subtitle">
          Übersicht über alle Produkte auf der Plattform.
        </p>
      </header>

      <div className="space-y-6">
        {/* FILTER / SEARCH */}
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
              <select
                name="vendor"
                defaultValue={vendorFilter ?? ""}
                className="input-neu w-40"
              >
                <option value="">Alle Vendoren</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.displayName ?? v.user?.email ?? v.id.slice(0, 8) + "…"}
                  </option>
                ))}
              </select>

              <select
                name="status"
                defaultValue={statusFilter ?? ""}
                className="input-neu w-40"
              >
                <option value="">Status: alle</option>
                <option value="ACTIVE">Aktiv</option>
                <option value="INACTIVE">Inaktiv</option>
              </select>

              <button type="submit" className="neobtn-sm">
                Filtern
              </button>
            </div>
          </form>
        </section>

        {/* TABLE */}
        <section className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-4 md:p-6 overflow-x-auto">
          <div className="mb-3 text-xs text-[var(--text-muted)]">
            {totalProducts} Produkte gefunden
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
                  <td
                    colSpan={6}
                    className="py-6 text-center text-[var(--text-muted)] text-sm"
                  >
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
                      <div className="flex justify-end gap-2 items-center">
                        <span className="text-xs text-[var(--text-muted)]">
                          {p.orders?.length ?? 0} Bestellungen
                        </span>
                        <Link
                          href={`/product/${p.id}`}
                          className="neobtn-sm ghost"
                        >
                          Anzeigen
                        </Link>
                        <Link
                          href={`/dashboard/edit/${p.id}`}
                          className="neobtn-sm"
                        >
                          Bearbeiten
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination (nur Links) */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2 text-xs">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNumber) => {
                  const params = new URLSearchParams();
                  if (search) params.set("q", search);
                  if (vendorFilter) params.set("vendor", vendorFilter);
                  if (statusFilter) params.set("status", statusFilter);
                  params.set("page", pageNumber.toString());

                  const href = `/admin/products?${params.toString()}`;
                  const isActive = pageNumber === page;

                  return (
                    <Link
                      key={pageNumber}
                      href={href}
                      className={`px-3 py-1 rounded-full border ${
                        isActive
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                          : "bg-[var(--neo-card-bg-soft)] text-[var(--text-main)] border-[var(--neo-card-border)]"
                      }`}
                    >
                      {pageNumber}
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
