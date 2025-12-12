// src/app/admin/users/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminUserStatusToggle from "./AdminUserStatusToggle";

type AdminUsersSearchParams = {
  q?: string;
  role?: string;
  page?: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<AdminUsersSearchParams>;
}) {
  // Session check (Server-seitig, kein window)
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Next 16: searchParams ist ein Promise → auflösen
  const params = await searchParams;
  const search = params.q ?? "";
  const role = params.role ?? "ALL";
  const page = Number(params.page ?? "1") || 1;
  const pageSize = 25;

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role !== "ALL") {
    where.role = role;
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: { orders: true, products: true },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="admin-shell">
      {/* Breadcrumb + Header im neuen Admin-Style */}
      <div className="admin-breadcrumb">
        <span>Admin</span>
        <span className="admin-breadcrumb-dot" />
        <span>User</span>
      </div>

      <header className="admin-header">
        <div className="admin-kicker">DigiEmu · Admin</div>
        <h1 className="admin-title">Userverwaltung</h1>
        <p className="admin-subtitle">
          Alle Nutzer, Rollen & Sperrstatus im Überblick.
        </p>
      </header>

      <div className="space-y-4">
        {/* Filterzeile */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <form className="flex gap-2 flex-wrap" method="get">
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Nach Name oder E-Mail suchen…"
              className="input-neu max-w-xs"
            />
            <select name="role" defaultValue={role} className="input-neu w-40">
              <option value="ALL">Alle Rollen</option>
              <option value="BUYER">Buyer</option>
              <option value="VENDOR">Vendor</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" className="neobtn-sm">
              Filtern
            </button>
          </form>
          <span className="text-xs text-[var(--text-muted)]">
            {totalCount} Nutzer gefunden
          </span>
        </div>

        {/* Tabelle */}
        <div className="overflow-x-auto rounded-2xl border border-[var(--neo-card-border)] bg-[var(--neo-card-bg-soft)] shadow-[var(--neo-card-shadow-soft)]">
          <table className="min-w-full text-sm admin-table">
            <thead>
              <tr>
                <th className="text-left py-2 px-4">E-Mail</th>
                <th className="text-left py-2 px-4">Name</th>
                <th className="text-left py-2 px-4">Rolle</th>
                <th className="text-left py-2 px-4">Status</th>
                <th className="text-left py-2 px-4">Erstellt</th>
                <th className="text-left py-2 px-4">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-200/40 last:border-0"
                >
                  <td className="text-[var(--text-main)] py-2 px-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="underline"
                    >
                      {user.email}
                    </Link>
                  </td>
                  <td className="text-[var(--text-main)] py-2 px-4">
                    {user.name ?? "—"}
                  </td>
                  <td className="text-[var(--text-main)] py-2 px-4">
                    {user.role}
                  </td>
                  <td className="py-2 px-4">
                    {user.isBlocked ? (
                      <span className="inline-flex rounded-full bg-rose-500/10 text-rose-500 px-3 py-0.5 text-xs font-medium">
                        Gesperrt
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-emerald-500/10 text-emerald-500 px-3 py-0.5 text-xs font-medium">
                        Aktiv
                      </span>
                    )}
                  </td>
                  <td className="text-[var(--text-muted)] text-xs py-2 px-4">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4">
                    <AdminUserStatusToggle
                      userId={user.id}
                      isBlocked={user.isBlocked}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end gap-2 mt-2 text-xs">
            <form method="get">
              <input type="hidden" name="q" value={search} />
              <input type="hidden" name="role" value={role} />
              <button
                type="submit"
                name="page"
                value={page - 1}
                disabled={page === 1}
                className="neobtn-sm"
              >
                « Zurück
              </button>
            </form>
            <span>
              Seite {page} / {totalPages}
            </span>
            <form method="get">
              <input type="hidden" name="q" value={search} />
              <input type="hidden" name="role" value={role} />
              <button
                type="submit"
                name="page"
                value={page + 1}
                disabled={page === totalPages}
                className="neobtn-sm"
              >
                Weiter »
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
