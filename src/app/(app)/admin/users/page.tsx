// src/app/admin/users/page.tsx
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { Role } from "@prisma/client";
import type { AdminUserListRow } from "@/lib/admin-types";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminUserStatusToggle from "./AdminUserStatusToggle";

export const dynamic = "force-dynamic";

type AdminUsersSearchParams = {
  q?: string;
  role?: string;
  page?: string;
  pageSize?: string;
};

function clampInt(v: string | undefined, fallback: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function buildQuery(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== "ALL") sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function paginationWindow(current: number, total: number) {
  const pages: (number | "…")[] = [];
  const add = (p: number | "…") => pages.push(p);

  if (total <= 7) {
    for (let i = 1; i <= total; i++) add(i);
    return pages;
  }

  add(1);

  const left = Math.max(2, current - 2);
  const right = Math.min(total - 1, current + 2);

  if (left > 2) add("…");
  for (let i = left; i <= right; i++) add(i);
  if (right < total - 1) add("…");

  add(total);
  return pages;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<AdminUsersSearchParams>;
}) {
  const session = await getServerSession(auth);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  // ✅ IMMER Strings
  const search = String(params.q ?? "");
  const role = String(params.role ?? "ALL");

  const page = clampInt(params.page, 1, 1, 10_000);
  const pageSize = clampInt(params.pageSize, 25, 10, 100);

  const where: Prisma.UserWhereInput = {};
  if (search.trim()) {
    where.OR = [
      { email: { contains: search.trim(), mode: "insensitive" } },
      { name: { contains: search.trim(), mode: "insensitive" } },
    ];
  }
  if (role !== "ALL") where.role = role as Role;

  const [usersRaw, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: { orders: { select: { id: true } }, products: { select: { id: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  const users = usersRaw as AdminUserListRow[];

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);

  const baseParams: Record<string, string | undefined> = {
    q: search.trim() ? search.trim() : undefined,
    role: role ? role : undefined,
    pageSize: String(pageSize),
  };

  const prevHref =
    safePage > 1 ? buildQuery({ ...baseParams, page: String(safePage - 1) }) : undefined;

  const nextHref =
    safePage < totalPages
      ? buildQuery({ ...baseParams, page: String(safePage + 1) })
      : undefined;

  const pageItems = paginationWindow(safePage, totalPages);

  const from = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(totalCount, safePage * pageSize);

  return (
    <div className="admin-shell">
      <div className="admin-breadcrumb">
        <span>Admin</span>
        <span className="admin-breadcrumb-dot" />
        <span>User</span>
      </div>

      <header className="admin-header">
        <div className="admin-kicker">DigiEmu · Admin</div>
        <h1 className="admin-title">Userverwaltung</h1>
        <p className="admin-subtitle">Alle Nutzer, Rollen & Sperrstatus im Überblick.</p>
      </header>

      <div className="space-y-4">
        {/* Filterzeile */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* ✅ Controlled: value statt defaultValue */}
          <form className="flex gap-2 flex-wrap" method="get">
            {/* bei Filter immer Seite 1 */}
            <input type="hidden" name="page" value="1" />

            <input
              type="text"
              name="q"
              value={search}                // ✅ controlled
              readOnly                     // ✅ Server Component: keine onChange -> readOnly, verhindert React warning
              placeholder="Nach Name oder E-Mail suchen…"
              className="input-neu max-w-xs"
            />

            <select
              name="role"
              value={role}                 // ✅ controlled
              disabled                     // ✅ Server Component: keine onChange -> disabled
              className="input-neu w-40"
            >
              <option value="ALL">Alle Rollen</option>
              <option value="BUYER">Buyer</option>
              <option value="VENDOR">Vendor</option>
              <option value="ADMIN">Admin</option>
            </select>

            <label className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">Pro Seite</span>
              <select
                name="pageSize"
                value={String(pageSize)}   // ✅ controlled
                disabled                   // ✅ Server Component: keine onChange -> disabled
                className="input-neu w-24"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>

            {/* ✅ Damit es trotzdem änderbar ist, nutzen wir eine zweite “echte” UI via details:
                Browser kann Werte ändern, weil es echte Inputs sind (nicht controlled).
                Das ist der sauberste Weg ohne Client-Komponente.
            */}
            <details className="ml-1">
              <summary className="neobtn-sm" style={{ listStyle: "none" }}>
                Filter bearbeiten
              </summary>

              <div className="mt-2 flex flex-wrap gap-2 items-center">
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

                <select name="pageSize" defaultValue={String(pageSize)} className="input-neu w-24">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>

                <button type="submit" className="neobtn-sm">
                  Anwenden
                </button>
              </div>
            </details>

            <noscript>
              <button type="submit" className="neobtn-sm">
                Filtern
              </button>
            </noscript>
          </form>

          <span className="text-xs text-[var(--text-muted)]">
            {totalCount === 0 ? (
              <>0 Nutzer</>
            ) : (
              <>
                Zeige <strong>{from}</strong>–<strong>{to}</strong> von{" "}
                <strong>{totalCount}</strong>
              </>
            )}
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
                <tr key={user.id} className="border-b border-slate-200/40 last:border-0">
                  <td className="text-[var(--text-main)] py-2 px-4">
                    <Link href={`/admin/users/${user.id}`} className="underline">
                      {user.email}
                    </Link>
                  </td>
                  <td className="text-[var(--text-main)] py-2 px-4">{user.name ?? "—"}</td>
                  <td className="text-[var(--text-main)] py-2 px-4">{user.role}</td>
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
                    {new Date(user.createdAt).toLocaleDateString("de-CH")}
                  </td>
                  <td className="py-2 px-4">
                    <AdminUserStatusToggle userId={user.id} isBlocked={user.isBlocked} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex flex-wrap items-center justify-end gap-2 mt-2" aria-label="Pagination">
            {prevHref ? (
              <Link className="neobtn-sm" href={prevHref}>
                « Zurück
              </Link>
            ) : (
              <span className="neobtn-sm opacity-50 cursor-not-allowed">« Zurück</span>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {pageItems.map((p, idx) =>
                p === "…" ? (
                  <span key={`dots-${idx}`} className="text-[var(--text-muted)] px-2">
                    …
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={buildQuery({ ...baseParams, page: String(p) })}
                    className={"neobtn-sm " + (p === safePage ? " !bg-[var(--accent)] !text-white" : "")}
                    aria-current={p === safePage ? "page" : undefined}
                  >
                    {p}
                  </Link>
                )
              )}
            </div>

            {nextHref ? (
              <Link className="neobtn-sm" href={nextHref}>
                Weiter »
              </Link>
            ) : (
              <span className="neobtn-sm opacity-50 cursor-not-allowed">Weiter »</span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
