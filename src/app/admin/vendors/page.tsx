import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import Link from "next/link";

// src/app/admin/vendors/page.tsx
type VendorSearchParams = {
  q?: string;
  status?: string;
  page?: string;
};

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<VendorSearchParams>;
}) {
  const sp = await searchParams; // Promise auflösen

  // Filters
  const search = sp.q ?? "";
  const status = sp.status ?? "ALL";
  const page = parseInt(sp.page ?? "1", 10);
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  // Build Prisma query
  const where: any = { role: "VENDOR" };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status && status !== "ALL") {
    where.status = status;
  }

  // Fetch vendors
  const [vendors, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
      include: {
        products: true, // TODO: confirm relation name
        // TODO: revenue aggregation
      },
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <main className="min-h-[80vh] w-full flex justify-center px-4 py-10 bg-[var(--bg)]">
      <div className="w-full max-w-5xl space-y-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--text-main)]">Verkäufer (Admin)</h1>
          <p className="text-xs text-[var(--text-muted)]">Alle Vendor-Accounts, mit Basisdaten & Status</p>
          <Link href="/admin" className="neo-btn neo-btn-secondary mt-2">Zurück zum Admin-Dashboard</Link>
        </header>
        {/* Filters */}
        <section className="neo-card p-6 mb-6 flex flex-wrap gap-4 items-center">
          <form className="flex flex-wrap gap-4 w-full" method="get">
            <input name="q" defaultValue={search} placeholder="Nach Name oder E-Mail suchen…" className="border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm w-52 bg-[var(--surface)] text-[var(--text-main)]" />
            <select name="status" defaultValue={status ?? "ALL"} className="border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm w-32 bg-[var(--surface)] text-[var(--text-main)]">
              <option value="ALL">Alle</option>
              <option value="ACTIVE">Aktiv</option>
              <option value="BLOCKED">Gesperrt</option>
            </select>
            <button type="submit" className="bg-[var(--accent-blue)] text-white rounded-xl px-4 py-2 text-sm font-medium shadow">Filter anwenden</button>
          </form>
        </section>
        {/* Vendors Table */}
        <section className="neo-card p-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface-alt)]">
                <th className="py-2 px-3 text-left font-semibold text-[var(--text-main)]">Name</th>
                <th className="py-2 px-3 text-left font-semibold text-[var(--text-main)]">E-Mail</th>
                <th className="py-2 px-3 text-left font-semibold text-[var(--text-main)]">Produkte</th>
                <th className="py-2 px-3 text-left font-semibold text-[var(--text-main)]">Umsatz gesamt</th>
                <th className="py-2 px-3 text-left font-semibold text-[var(--text-main)]">Status</th>
                <th className="py-2 px-3 text-left font-semibold text-[var(--text-main)]">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    <span className="text-2xl">🧑‍💼</span>
                    <span className="font-semibold text-[var(--text-main)]">Keine Verkäufer gefunden</span>
                    <span className="text-xs text-[var(--text-muted)]">Filter anpassen oder Suchbegriff ändern.</span>
                  </td>
                </tr>
              ) : (
                vendors.map((v) => {
                  // TODO: Calculate revenue aggregation for vendor
                  const revenue = 0;
                  return (
                    <tr key={v.id} className="border-b border-slate-100">
                      <td className="py-2 px-3 font-medium text-slate-900">{v.name}</td>
                      <td className="py-2 px-3">{v.email}</td>
                      <td className="py-2 px-3">{v.products?.length ?? 0}</td>
                      <td className="py-2 px-3">{(revenue / 100).toFixed(2)} CHF</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${v.status === "ACTIVE" ? "bg-green-100 text-green-700" : v.status === "BLOCKED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>{v.status ?? "-"}</span>
                      </td>
                      <td className="py-2 px-3 flex gap-2">
                        <Link href={`/admin/vendors/${v.id}`} className="text-indigo-500 hover:underline text-xs">Vendor-Ansicht</Link>
                        {v.status === "ACTIVE" && (
                          <button className="px-3 py-1 rounded-xl bg-red-100 text-red-700 text-xs font-semibold">Sperren</button>
                        )}
                        {v.status === "BLOCKED" && (
                          <button className="px-3 py-1 rounded-xl bg-green-100 text-green-700 text-xs font-semibold">Entsperren</button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <span className="text-xs text-slate-500">Seite {page} von {Math.ceil(totalCount / pageSize)}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/vendors?page=${page - 1}&q=${search}&status=${status}`} className="px-3 py-1 rounded-xl bg-slate-100 text-xs">Zurück</Link>
              )}
              {page < Math.ceil(totalCount / pageSize) && (
                <Link href={`/admin/vendors?page=${page + 1}&q=${search}&status=${status}`} className="px-3 py-1 rounded-xl bg-slate-100 text-xs">Weiter</Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
