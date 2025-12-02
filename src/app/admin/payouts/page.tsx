// src/app/admin/payouts/page.tsx
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";

type SearchParamsPromise = Promise<{
  vendor?: string;
  status?: string;
  dateRange?: string;
  page?: string;
}>;

interface AdminPayoutsPageProps {
  searchParams: SearchParamsPromise;
}

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage({
  searchParams,
}: AdminPayoutsPageProps) {
  // ---------- FILTERS / PAGINATION ----------
  const params = await searchParams;

  const vendorId = params.vendor ?? "";
  const status = (params.status as "ALL" | "PENDING" | "PAID" | undefined) ?? "ALL";
  const dateRange = params.dateRange ?? "30d";
  const page = parseInt(params.page ?? "1", 10);
  const pageSize = 20;

  // Zeitraum bestimmen
  const now = new Date();
  let fromDate: Date | undefined;

  switch (dateRange) {
    case "7d":
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "all":
    default:
      fromDate = undefined;
  }

  const where: any = {};

  if (vendorId) {
    where.vendorId = vendorId;
  }

  if (status !== "ALL") {
    where.status = status;
  }

  if (fromDate) {
    where.createdAt = { gte: fromDate };
  }

  // ---------- SUMMARY BOX DATA ----------
  const [totalPendingAgg, totalPaidLast30Agg, openRequestsCount, vendors] =
    await Promise.all([
      prisma.payout.aggregate({
        _sum: { amountCents: true },
        where: { status: "PENDING" },
      }),
      prisma.payout.aggregate({
        _sum: { amountCents: true },
        where: {
          status: "PAID",
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.payout.count({ where: { status: "PENDING" } }),
      prisma.user.findMany({
        where: { role: "VENDOR" },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
    ]);

  const totalPendingCents = totalPendingAgg._sum.amountCents ?? 0;
  const totalPaidLast30Cents = totalPaidLast30Agg._sum.amountCents ?? 0;

  // ---------- PAGINATED PAYOUTS ----------
  const [payouts, totalCount] = await Promise.all([
    prisma.payout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        vendor: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.payout.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // ---------- JSX ----------
  return (
    <main className="min-h-[calc(100vh-6rem)] bg-[var(--bg)] px-4 py-8 text-[var(--text-main)]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin – Auszahlungen</h1>
            <p className="text-sm text-[var(--muted)]">
              Überblick über Vendor-Payouts, Status und offene Anfragen.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center rounded-2xl px-4 py-2 text-sm font-medium
              bg-[var(--primary)] text-white shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]
              hover:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.25),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]
              transition-all active:scale-[0.97]"
          >
            Zur Admin-Übersicht
          </Link>
        </section>

        {/* KPI-CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Offene Auszahlungen"
            value={openRequestsCount}
            subLabel="Status: PENDING"
          />
          <KpiCard
            label="Auszahlungsvolumen offen"
            value={(totalPendingCents / 100).toFixed(2) + " CHF"}
            subLabel="Noch nicht bezahlt"
          />
          <KpiCard
            label="Ausbezahlt (30 Tage)"
            value={(totalPaidLast30Cents / 100).toFixed(2) + " CHF"}
            subLabel="Status: PAID (30d)"
          />
        </section>

        {/* FILTERS */}
        <section
          className="rounded-3xl bg-[var(--card-bg)] p-4
          shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.08)]
          border border-[var(--border-soft)]"
        >
          <form className="flex flex-wrap gap-4 items-end">
            {/* Vendor Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted)]">
                Vendor
              </label>
              <select
                name="vendor"
                defaultValue={vendorId}
                className="rounded-xl border border-[var(--border-soft)] bg-[var(--input-bg)]
                  px-3 py-2 text-sm outline-none
                  shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(255,255,255,0.08)]"
              >
                <option value="">Alle</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name || v.email || v.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted)]">
                Status
              </label>
              <select
                name="status"
                defaultValue={status}
                className="rounded-xl border border-[var(--border-soft)] bg-[var(--input-bg)]
                  px-3 py-2 text-sm outline-none
                  shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(255,255,255,0.08)]"
              >
                <option value="ALL">Alle</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted)]">
                Zeitraum
              </label>
              <select
                name="dateRange"
                defaultValue={dateRange}
                className="rounded-xl border border-[var(--border-soft)] bg-[var(--input-bg)]
                  px-3 py-2 text-sm outline-none
                  shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),inset_-2px_-2px_4px_rgba(255,255,255,0.08)]"
              >
                <option value="7d">7 Tage</option>
                <option value="30d">30 Tage</option>
                <option value="90d">90 Tage</option>
                <option value="all">Alle</option>
              </select>
            </div>

            <button
              type="submit"
              className="ml-auto rounded-2xl px-4 py-2 text-sm font-medium
                bg-[var(--primary)] text-white
                shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.25)]
                hover:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.25),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]
                transition-all active:scale-[0.97]"
            >
              Filtern
            </button>
          </form>
        </section>

        {/* PAYOUTS TABLE */}
        <section
          className="rounded-3xl bg-[var(--card-bg)] p-6
          shadow-[10px_10px_22px_rgba(0,0,0,0.18),-10px_-10px_22px_rgba(255,255,255,0.06)]
          border border-[var(--border-soft)]"
        >
          <h2 className="text-sm font-semibold mb-4">Payouts</h2>

          {payouts.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">
              Keine Auszahlungen für die aktuelle Filterung gefunden.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--border-soft)]">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--table-header-bg)] text-[var(--muted-strong)] text-xs uppercase tracking-wide">
                  <tr>
                    <th className="py-3 px-4 text-left">Vendor</th>
                    <th className="py-3 px-4 text-left">Betrag</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Erstellt</th>
                    <th className="py-3 px-4 text-left">Aktualisiert</th>
                    <th className="py-3 px-4 text-left">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--table-bg)]">
                  {payouts.map((payout) => (
                    <tr
                      key={payout.id}
                      className="border-t border-[var(--border-soft)] hover:bg-[var(--table-row-hover)] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {payout.vendor?.name || "Unbekannt"}
                          </span>
                          <span className="text-[11px] text-[var(--muted)]">
                            {payout.vendor?.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {(payout.amountCents / 100).toFixed(2)} CHF
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            payout.status === "PAID"
                              ? "bg-emerald-100/10 text-emerald-400 border border-emerald-500/40"
                              : "bg-amber-100/10 text-amber-400 border border-amber-500/40"
                          }`}
                        >
                          {payout.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[13px] text-[var(--muted)]">
                        {format(payout.createdAt, "dd.MM.yyyy HH:mm", {
                          locale: de,
                        })}
                      </td>
                      <td className="py-3 px-4 text-[13px] text-[var(--muted)]">
                        {format(payout.updatedAt, "dd.MM.yyyy HH:mm", {
                          locale: de,
                        })}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[var(--muted)]">
                        {/* Hier waren vorher Buttons mit onClick → erstmal deaktiviert */}
                        <span className="italic">
                          Aktionen (z.B. &quot;Als bezahlt markieren&quot;) bauen
                          wir später als Client-Komponente / Server Action ein.
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2 text-xs">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const isActive = p === page;

                const search = new URLSearchParams();
                if (vendorId) search.set("vendor", vendorId);
                if (status) search.set("status", status);
                if (dateRange) search.set("dateRange", dateRange);
                search.set("page", String(p));

                return (
                  <Link
                    key={p}
                    href={`/admin/payouts?${search.toString()}`}
                    className={`px-3 py-1 rounded-full border text-xs ${
                      isActive
                        ? "bg-[var(--primary)] text-white border-transparent"
                        : "bg-[var(--chip-bg)] text-[var(--muted)] border-[var(--border-soft)]"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ----------------- SUB COMPONENT ----------------- */

function KpiCard({
  label,
  value,
  subLabel,
}: {
  label: string;
  value: number | string;
  subLabel?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 bg-[var(--card-bg)]
      shadow-[8px_8px_16px_rgba(0,0,0,0.18),-8px_-8px_16px_rgba(255,255,255,0.05)]
      border border-[var(--border-soft)]"
    >
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[var(--text-main)]">
        {value}
      </div>
      {subLabel && (
        <div className="text-[11px] text-[var(--muted)] mt-1">{subLabel}</div>
      )}
    </div>
  );
}
