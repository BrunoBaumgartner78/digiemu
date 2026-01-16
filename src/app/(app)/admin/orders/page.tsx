// src/app/admin/orders/page.tsx
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AdminOrderRow } from "@/lib/admin-types";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

type Props = {
  // Next 15/16: searchParams kann Promise sein
  searchParams?: Promise<SearchParams>;
};

function pickFirst(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

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
  // nice window: 1 … c-2 c-1 c c+1 c+2 … total
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

export default async function AdminOrdersPage({ searchParams }: Props) {
  const session = await getServerSession(auth);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const sp: SearchParams = searchParams ? await searchParams : {};

  // Filters
  const status = pickFirst(sp.status) ?? "ALL";
  const vendor = pickFirst(sp.vendor) ?? "ALL";

  // Pagination
  const page = clampInt(pickFirst(sp.page), 1, 1, 10_000);
  const pageSize = clampInt(pickFirst(sp.pageSize), 20, 5, 100);

  const where: Prisma.OrderWhereInput = {};
  if (status !== "ALL") where.status = status;
  // ✅ Product.vendorId ist bei dir User-ID des Vendors
  if (vendor !== "ALL") where.product = { vendorId: vendor } as any;

  const [total, orders, vendors] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        product: {
          select: {
            title: true,
            vendor: {
              select: {
                id: true,
                email: true,
                vendorProfile: { select: { displayName: true } },
              },
            },
          },
        },
        buyer: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.findMany({
      where: { role: "VENDOR" },
      select: {
        id: true,
        email: true,
        vendorProfile: { select: { displayName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const baseParams = {
    status,
    vendor,
    pageSize: String(pageSize),
  };

  const prevHref =
    safePage > 1
      ? buildQuery({ ...baseParams, page: String(safePage - 1) })
      : undefined;

  const nextHref =
    safePage < totalPages
      ? buildQuery({ ...baseParams, page: String(safePage + 1) })
      : undefined;

  const pageItems = paginationWindow(safePage, totalPages);

  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);

  return (
    <div className="admin-shell">
      <div className="admin-breadcrumb">
        <span>Admin</span>
        <span className="admin-breadcrumb-dot" />
        <span>Orders</span>
      </div>

      <header className="admin-header">
        <div className="admin-kicker">DigiEmu · Admin</div>
        <h1 className="admin-title">Bestellungen</h1>
        <p className="admin-subtitle">Alle Bestellungen, Einnahmen-Aufteilung & Status.</p>
      </header>

      <section className="mb-6">
        {/* ✅ Wenn Filter geändert werden: zurück auf Seite 1 */}
        <form className="flex flex-wrap gap-2 items-center">
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="pageSize" value={String(pageSize)} />

          <label>
            Status:
            <select name="status" defaultValue={status} className="input-neu ml-2">
              <option value="ALL">Alle</option>
              <option value="PAID">Bezahlt</option>
              <option value="PENDING">Ausstehend</option>
            </select>
          </label>

          <label>
            Vendor:
            <select name="vendor" defaultValue={vendor} className="input-neu ml-2">
              <option value="ALL">Alle</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vendorProfile?.displayName || v.email}
                </option>
              ))}
            </select>
          </label>

          <label>
            Pro Seite:
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="input-neu ml-2"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>

          <button type="submit" className="neobtn-sm">
            Filtern
          </button>
        </form>

        <div className="mt-3 text-sm text-[var(--text-muted)]">
          {total === 0 ? (
            <>0 Bestellungen</>
          ) : (
            <>
              Zeige <strong>{from}</strong>–<strong>{to}</strong> von{" "}
              <strong>{total}</strong> Bestellungen
            </>
          )}
        </div>
      </section>

      {orders.length === 0 ? (
        <div className="admin-card text-[var(--text-muted)]">
          Keine Bestellungen gefunden.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Produkt</th>
                  <th>Vendor</th>
                  <th>Käufer</th>
                  <th>Betrag (CHF)</th>
                  <th>Plattform (CHF)</th>
                  <th>Vendor (CHF)</th>
                  <th>Status</th>
                  <th>Erstellt am</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs">{order.id.slice(0, 8)}…</td>
                    <td>{order.product?.title || "-"}</td>
                    <td>
                      {order.product?.vendor?.vendorProfile?.displayName ||
                        order.product?.vendor?.email ||
                        "-"}
                    </td>
                    <td>{order.buyer?.email || "-"}</td>
                    <td>{(order.amountCents / 100).toFixed(2)}</td>
                    <td>{(order.platformEarningsCents / 100).toFixed(2)}</td>
                    <td>{(order.vendorEarningsCents / 100).toFixed(2)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString("de-CH")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <nav
            className="mt-5 flex flex-wrap items-center gap-2"
            aria-label="Pagination"
          >
            {prevHref ? (
              <Link className="neobtn-sm" href={prevHref}>
                ← Zurück
              </Link>
            ) : (
              <span className="neobtn-sm opacity-50 cursor-not-allowed">← Zurück</span>
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
                    className={
                      "neobtn-sm " +
                      (p === safePage ? " !bg-[var(--accent)] !text-white" : "")
                    }
                    aria-current={p === safePage ? "page" : undefined}
                  >
                    {p}
                  </Link>
                )
              )}
            </div>

            {nextHref ? (
              <Link className="neobtn-sm" href={nextHref}>
                Weiter →
              </Link>
            ) : (
              <span className="neobtn-sm opacity-50 cursor-not-allowed">Weiter →</span>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
