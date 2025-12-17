// src/app/admin/vendors/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

type SearchParams = {
  q?: string | string[];
  status?: string | string[]; // UI Filter bleibt, aber wir leiten daraus Prisma-Filter ab
  page?: string | string[];
};

export default async function AdminVendorsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
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

  const search =
    typeof sp.q === "string" ? sp.q : Array.isArray(sp.q) ? sp.q[0] ?? "" : "";

  const statusRaw =
    typeof sp.status === "string"
      ? sp.status
      : Array.isArray(sp.status)
      ? sp.status[0] ?? "ALL"
      : "ALL";

  // UI-Status: ALL | ACTIVE | BLOCKED
  const statusFilter = statusRaw || "ALL";

  const pageRaw =
    typeof sp.page === "string"
      ? sp.page
      : Array.isArray(sp.page)
      ? sp.page[0] ?? "1"
      : "1";

  const page = Number.parseInt(pageRaw, 10) || 1;
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  // ✅ User hat KEIN "status" -> wir filtern über vendorProfile/isPublic oder Existenz
  // Wenn du wirklich "BLOCKED" brauchst, müssen wir ein echtes Feld im Schema einführen.
  const where: any = { role: "VENDOR" };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  // ✅ Statusfilter auf existierende Felder mappen:
  // - ACTIVE: Vendor hat ein VendorProfile
  // - BLOCKED: Vendor hat KEIN VendorProfile (oder du kannst später echtes Feld einführen)
  if (statusFilter === "ACTIVE") {
    where.vendorProfile = { isNot: null };
  } else if (statusFilter === "BLOCKED") {
    where.vendorProfile = { is: null };
  }
  // ALL => kein extra Filter

  const [vendors, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
      include: {
        products: {
          include: {
            orders: {
              select: { vendorEarningsCents: true },
            },
          },
        },
        vendorProfile: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

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
        <p className="admin-subtitle">
          Alle Vendor-Accounts, mit Basisdaten & Status.
        </p>
      </header>

      <section className="neumorph-card p-6 mb-6 flex flex-wrap gap-4 items-center">
        <form className="flex flex-wrap gap-4 w-full" method="get">
          <input
            name="q"
            defaultValue={search}
            placeholder="Nach Name oder E-Mail suchen…"
            className="input-neu w-full max-w-xs text-sm"
          />
          <select
            name="status"
            defaultValue={statusFilter}
            className="input-neu w-40 text-sm"
          >
            <option value="ALL">Alle</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="BLOCKED">Gesperrt</option>
          </select>
          <button type="submit" className="neobtn-sm">
            Filter anwenden
          </button>
        </form>
      </section>

      <section className="neumorph-card p-6 overflow-x-auto">
        <table className="min-w-full text-sm admin-table">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left">Name / Vendor</th>
              <th className="py-2 px-3 text-left">E-Mail</th>
              <th className="py-2 px-3 text-left">Produkte</th>
              <th className="py-2 px-3 text-left">Umsatz gesamt</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-left">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-[var(--text-muted)]"
                >
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
                  const productSum = p.orders.reduce(
                    (sumO, o) => sumO + (o.vendorEarningsCents ?? 0),
                    0
                  );
                  return sumP + productSum;
                }, 0);

                // ✅ Status ableiten (keine v.status!)
                const derivedStatus = v.vendorProfile ? "ACTIVE" : "BLOCKED";

                return (
                  <tr
                    key={v.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-2 px-3 font-medium text-[var(--text-main)]">
                      {v.name || "—"}
                    </td>
                    <td className="py-2 px-3">{v.email}</td>
                    <td className="py-2 px-3">{v.products?.length ?? 0}</td>
                    <td className="py-2 px-3">
                      {(revenueCents / 100).toFixed(2)} CHF
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          derivedStatus === "ACTIVE"
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
                      <Link
                        href={`/admin/payouts/vendor/${v.id}`}
                        className="neobtn-sm ghost"
                      >
                        Payouts
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="flex justify-between items-center mt-6 text-xs text-[var(--text-muted)]">
          <span>
            Seite {page} von {pageCount} · {totalCount} Vendoren
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/vendors?page=${page - 1}&q=${encodeURIComponent(
                  search
                )}&status=${statusFilter}`}
                className="neobtn-sm ghost"
              >
                ← Zurück
              </Link>
            )}
            {page < pageCount && (
              <Link
                href={`/admin/vendors?page=${page + 1}&q=${encodeURIComponent(
                  search
                )}&status=${statusFilter}`}
                className="neobtn-sm ghost"
              >
                Weiter →
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
