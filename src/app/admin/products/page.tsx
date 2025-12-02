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
    <div className="min-h-[calc(100vh-6rem)] bg-[var(--bg)] px-4 py-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-main)]">
              Admin – Produkte
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Übersicht über alle Produkte auf der Plattform.
            </p>
          </div>
        </section>

        {/* FILTER / SEARCH */}
        <section className="rounded-3xl bg-[var(--card-bg)] shadow-[9px_9px_20px_rgba(0,0,0,0.2),-9px_-9px_20px_rgba(255,255,255,0.05)] p-4 md:p-6">
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
                className="w-full rounded-2xl px-3 py-2 text-sm bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-soft)] outline-none shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.08)]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                name="vendor"
                defaultValue={vendorFilter ?? ""}
                className="rounded-2xl px-3 py-2 text-sm bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-soft)] outline-none shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.08)]"
              >
                <option value="">Alle Vendoren</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.displayName ??
                      v.user?.email ??
                      v.id.slice(0, 8) + "…"}
                  </option>
                ))}
              </select>

              <select
                name="status"
                defaultValue={statusFilter ?? ""}
                className="rounded-2xl px-3 py-2 text-sm bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--border-soft)] outline-none shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.08)]"
              >
                <option value="">Status: alle</option>
                <option value="ACTIVE">Aktiv</option>
                <option value="INACTIVE">Inaktiv</option>
              </select>

              <button
                type="submit"
                className="rounded-2xl px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.3)]"
              >
                Filtern
              </button>
            </div>
          </form>
        </section>

        {/* TABLE */}
        <section className="rounded-3xl bg-[var(--card-bg)] shadow-[9px_9px_20px_rgba(0,0,0,0.2),-9px_-9px_20px_rgba(255,255,255,0.05)] p-4 md:p-6 overflow-x-auto">
          <div className="mb-3 text-xs text-[var(--text-muted)]">
            {totalProducts} Produkte gefunden
          </div>

          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[var(--table-header-bg)]">
                <th className="py-2 px-3 text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  Titel
                </th>
                <th className="py-2 px-3 text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  Vendor
                </th>
                <th className="py-2 px-3 text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  Preis
                </th>
                <th className="py-2 px-3 text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  Status
                </th>
                <th className="py-2 px-3 text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  Erstellt
                </th>
                <th className="py-2 px-3 text-right text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  Aktionen
                </th>
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
                products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-[var(--border-soft)] hover:bg-[var(--table-row-hover-bg)] transition-colors"
                  >
                    <td className="py-2 px-3 text-[var(--text-main)]">
                      {p.title}
                    </td>
                    <td className="py-2 px-3 text-[var(--text-muted)] text-xs">
                      {p.vendor?.email ?? p.vendorId}
                    </td>
                    <td className="py-2 px-3 text-[var(--text-main)]">
                      {(p.priceCents / 100).toFixed(2)} CHF
                    </td>
                    <td className="py-2 px-3 text-[var(--text-main)]">
                      {p.isActive ? "Aktiv" : "Inaktiv"}
                    </td>
                    <td className="py-2 px-3 text-[var(--text-muted)] text-xs">
                      {new Date(p.createdAt).toLocaleDateString("de-CH")}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/product/${p.id}`}
                          className="text-[11px] px-2 py-1 rounded-md bg-[var(--pill-bg)] text-[var(--text-main)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)]"
                        >
                          Anzeigen
                        </Link>
                        <Link
                          href={`/dashboard/products/${p.id}/edit-product`}
                          className="text-[11px] px-2 py-1 rounded-md bg-[var(--primary-soft)] text-[var(--primary-text)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)]"
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

          {/* Pagination ohne onClick – nur Links */}
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
                          ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                          : "bg-[var(--pill-bg)] text-[var(--text-main)] border-[var(--border-soft)]"
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
