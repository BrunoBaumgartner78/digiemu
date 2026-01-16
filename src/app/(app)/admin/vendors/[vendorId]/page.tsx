// src/app/admin/vendors/[vendorId]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminVendorDetail } from "@/lib/admin-types";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { vendorId: string };

function chf(cents: number) {
  return `CHF ${(cents / 100).toFixed(2)}`;
}

function fmtDate(d: Date) {
  try {
    return new Intl.DateTimeFormat("de-CH", { dateStyle: "medium" }).format(d);
  } catch {
    return d.toISOString();
  }
}

export default async function AdminVendorDetailPage(props: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const { vendorId } = await props.params;

  const vendor = await prisma.user.findUnique({
    where: { id: vendorId },
    include: {
      vendorProfile: true,
      products: {
        orderBy: { createdAt: "desc" },
        include: {
          orders: { select: { vendorEarningsCents: true, createdAt: true } },
        },
      },
      payouts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!vendor) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-6 max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Vendor nicht gefunden</h1>
          <Link href="/admin/vendors" className="neobtn mt-3 inline-flex">
            Zurück zur Verkäuferliste
          </Link>
        </div>
      </main>
    );
  }

  const v = vendor as unknown as AdminVendorDetail;

  const totalEarningsCents = v.products.reduce((sumP, p) => {
    const s = p.orders.reduce((sumO: number, o) => sumO + (o.vendorEarningsCents ?? 0), 0);
    return sumP + s;
  }, 0);

  const alreadyPaidCents = v.payouts
    .filter((p) => p.status === "PAID")
    .reduce((sum: number, p) => sum + (p.amountCents ?? 0), 0);

  const pendingCents = Math.max(totalEarningsCents - alreadyPaidCents, 0);

  const status = v.isBlocked ? "BLOCKED" : "ACTIVE";
  const profileStatus = v.vendorProfile ? "PROFILE" : "NO_PROFILE";

  const statusBadge =
    status === "ACTIVE"
      ? "bg-emerald-500/10 text-emerald-400"
      : "bg-rose-500/10 text-rose-400";

  const profileBadge =
    profileStatus === "PROFILE"
      ? "bg-sky-500/10 text-sky-300"
      : "bg-slate-500/10 text-slate-300";

  return (
    <main className="page-shell-wide space-y-6">
      {/* Header Card */}
      <section className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-[var(--text-muted)]">Admin · Vendor</div>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-[var(--text-main)] truncate">
                {v.name || "—"} <span className="opacity-50">·</span>{" "}
                <span className="font-mono text-sm md:text-base">{v.email}</span>
              </h1>

              <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-medium ${statusBadge}`}>
                {status}
              </span>

              <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-medium ${profileBadge}`}>
                {profileStatus}
              </span>
            </div>

            <div className="mt-2 text-xs text-[var(--text-muted)]">
              Vendor-ID: <span className="font-mono">{v.id}</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap md:justify-end">
            <Link href="/admin/vendors" className="neobtn-sm ghost">
              ← Zurück
            </Link>
            <Link href={`/admin/payouts/vendor/${v.id}`} className="neobtn-sm">
              Payout-Übersicht
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-5">
          <div className="text-xs text-[var(--text-muted)]">Gesamte Einnahmen</div>
          <div className="mt-1 text-2xl font-bold text-[var(--text-main)]">{chf(totalEarningsCents)}</div>
        </div>

        <div className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-5">
          <div className="text-xs text-[var(--text-muted)]">Ausbezahlt</div>
          <div className="mt-1 text-2xl font-bold text-[var(--text-main)]">{chf(alreadyPaidCents)}</div>
        </div>

        <div className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-5">
          <div className="text-xs text-[var(--text-muted)]">Ausstehend</div>
          <div className="mt-1 text-2xl font-bold text-[var(--text-main)]">{chf(pendingCents)}</div>
        </div>
      </section>

      {/* Profile / Basic Info */}
      <section className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Basisdaten</h2>
          <div className="flex gap-2">
            <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-medium ${statusBadge}`}>
              {status}
            </span>
            <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-medium ${profileBadge}`}>
              {profileStatus}
            </span>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-[var(--neo-card-border)] bg-[var(--bg-soft)] p-4">
            <div className="text-xs text-[var(--text-muted)]">E-Mail</div>
            <div className="mt-1 font-medium text-[var(--text-main)]">{vendor.email}</div>
          </div>

          <div className="rounded-2xl border border-[var(--neo-card-border)] bg-[var(--bg-soft)] p-4">
            <div className="text-xs text-[var(--text-muted)]">Name</div>
            <div className="mt-1 font-medium text-[var(--text-main)]">{vendor.name || "—"}</div>
          </div>

          <div className="rounded-2xl border border-[var(--neo-card-border)] bg-[var(--bg-soft)] p-4">
            <div className="text-xs text-[var(--text-muted)]">Öffentlicher Name</div>
            <div className="mt-1 font-medium text-[var(--text-main)]">
              {vendor.vendorProfile?.displayName || "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--neo-card-border)] bg-[var(--bg-soft)] p-4">
            <div className="text-xs text-[var(--text-muted)]">Kurzbeschreibung</div>
            <div className="mt-1 font-medium text-[var(--text-main)]">
              {vendor.vendorProfile?.bio || "—"}
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Produkte</h2>
          <div className="text-xs text-[var(--text-muted)]">{v.products.length} Produkte</div>
        </div>

        {v.products.length === 0 ? (
          <div className="mt-3 text-sm text-[var(--text-muted)]">Dieser Vendor hat noch keine Produkte.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm admin-table">
              <thead>
                <tr>
                  <th className="py-2 px-3 text-left">Produkt</th>
                  <th className="py-2 px-3 text-left">Bestellungen</th>
                  <th className="py-2 px-3 text-left">Umsatz (Vendor)</th>
                  <th className="py-2 px-3 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {v.products.map((p) => {
                  const productRevenue = p.orders.reduce(
                    (sum: number, o) => sum + (o.vendorEarningsCents ?? 0),
                    0
                  );

                  return (
                    <tr
                      key={p.id}
                      className="border-t border-[var(--neo-card-border)] hover:bg-[rgba(148,163,184,0.08)] transition-colors"
                    >
                      <td className="py-2 px-3">
                        <div className="font-medium text-[var(--text-main)]">{p.title}</div>
                        <div className="text-xs text-[var(--text-muted)] line-clamp-2">
                          {p.description?.trim() ? p.description.slice(0, 110) : "Keine Beschreibung"}
                        </div>
                      </td>

                      <td className="py-2 px-3 text-[var(--text-main)]">{p.orders.length}</td>

                      <td className="py-2 px-3 text-[var(--text-main)]">{chf(productRevenue)}</td>

                      <td className="py-2 px-3 text-right">
                        <Link href={`/admin/products/edit/${p.id}`} className="neobtn-sm">
                          Bearbeiten
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payouts */}
      <section className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Bisherige Auszahlungen</h2>
          <div className="text-xs text-[var(--text-muted)]">{v.payouts.length} Einträge</div>
        </div>

        {v.payouts.length === 0 ? (
          <div className="mt-3 text-sm text-[var(--text-muted)]">Noch keine Auszahlungen erfasst.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm admin-table">
              <thead>
                <tr>
                  <th className="py-2 px-3 text-left">Datum</th>
                  <th className="py-2 px-3 text-left">Betrag</th>
                  <th className="py-2 px-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {v.payouts.map((p) => {
                  const badge =
                    p.status === "PAID"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-300";

                  return (
                    <tr
                      key={p.id}
                      className="border-t border-[var(--neo-card-border)] hover:bg-[rgba(148,163,184,0.08)] transition-colors"
                    >
                      <td className="py-2 px-3 text-[var(--text-main)]">{fmtDate(p.createdAt)}</td>
                      <td className="py-2 px-3 text-[var(--text-main)]">{chf(p.amountCents)}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-medium ${badge}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
