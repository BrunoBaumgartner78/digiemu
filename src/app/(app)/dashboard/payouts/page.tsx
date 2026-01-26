// src/app/dashboard/payouts/page.tsx
import { requireVendorPage } from "@/lib/guards/authz";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { nowMs, msFromDays } from "@/lib/time";
import RequestPayoutButton from "./RequestPayoutButton";
type SearchParams = { [key: string]: string | string[] | undefined };
type Props = { searchParams?: Promise<SearchParams> };

export const metadata = {
  title: "Auszahlungen – Vendor Dashboard",
};

export const dynamic = "force-dynamic";

function chf(cents: number) {
  return `CHF ${(cents / 100).toFixed(2)}`;
}

export default async function VendorPayoutsPage(props: Props) {
  const session = await requireVendorPage();
  const params = props.searchParams ? await props.searchParams : {};
  const rangeParam = typeof params.range === "string" ? params.range : undefined;

  if (!session?.user) redirect("/login");
  const user = session.user as { id?: string; role?: string };
  if (user.role !== "VENDOR") redirect("/login");

  const vendorId = String(user.id);

  // ✅ Robust: ältere/abweichende Status-Werte berücksichtigen
  const paidLikeStatuses = [
    "PAID",
    "paid",
    "COMPLETED",
    "completed",
    "SUCCESS",
    "success",
  ];

  /**
   * ✅ Earnings Quelle:
   * - Prefer: OrderItem.vendorEarningsCents (Vendor = 80%)
   * - Fallback: Order.vendorEarningsCents
   *
   * => Matcht sauber mit Payout-Requests (z.B. 191.84 = 80% von 239.80).
   */
  let totalEarnings = 0;

  // Prisma Client hat evtl. (noch) kein orderItem im Typing: daher "as any" safe-check.
  const hasOrderItemAggregate =
    typeof (prisma as any).orderItem?.aggregate === "function";

  if (hasOrderItemAggregate) {
    const agg = await (prisma as any).orderItem.aggregate({
      _sum: { vendorEarningsCents: true },
      where: {
        vendorId,
        order: { status: { in: paidLikeStatuses } },
        ...(rangeParam && rangeParam !== "all"
          ? { createdAt: { gte: new Date(nowMs() - msFromDays(Number(rangeParam))) } }
          : {}),
      },
    });
    totalEarnings = agg?._sum?.vendorEarningsCents ?? 0;
  } else {
    const agg = await prisma.order.aggregate({
      _sum: { vendorEarningsCents: true },
      where: {
        product: { vendorId },
        status: { in: paidLikeStatuses },
        ...(rangeParam && rangeParam !== "all" ? { createdAt: { gte: new Date(nowMs() - msFromDays(Number(rangeParam))) } } : {}),
      },
    });
    totalEarnings = agg._sum.vendorEarningsCents ?? 0;
  }

  // ✅ Bereits ausbezahlt (PAID payouts)
  const paidAgg = await prisma.payout.aggregate({
    _sum: { amountCents: true },
    where: { vendorId, status: "PAID" },
  });
  const alreadyPaid = paidAgg._sum.amountCents ?? 0;

  // ✅ Offene Requests (PENDING payouts)
  const pendingAgg = await prisma.payout.aggregate({
    _sum: { amountCents: true },
    where: { vendorId, status: "PENDING" },
  });
  const pendingRequested = pendingAgg._sum.amountCents ?? 0;

  // ✅ Verfügbar = Earnings - Paid - PendingRequests
  const available = Math.max(totalEarnings - alreadyPaid - pendingRequested, 0);

  // ✅ Historie
  const payouts = await prisma.payout.findMany({
    where: rangeParam && rangeParam !== "all" ? { vendorId, createdAt: { gte: new Date(nowMs() - msFromDays(Number(rangeParam))) } } : { vendorId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="page-shell-wide">
      <section className="neo-surface p-6 md:p-8 space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Auszahlungen
          </h1>
          <p className="text-sm text-white/75 max-w-2xl">
            Hier siehst du deine Vendor-Earnings (80%), bereits bezahlte
            Auszahlungen und offene Payout-Requests.
          </p>
        </header>

        {/* Summary Cards */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="neo-card p-6 md:p-7">
            <div className="text-xs uppercase tracking-[0.18em] text-white/70">
              Vendor-Earnings (80%)
            </div>
            <div className="mt-3 text-2xl font-extrabold text-white">
              {chf(totalEarnings)}
            </div>
            <div className="mt-2 text-xs text-white/60">
              Summe deiner Einnahmen aus bezahlten Bestellungen (nach Split).
            </div>
          </div>

          <div className="neo-card p-6 md:p-7">
            <div className="text-xs uppercase tracking-[0.18em] text-white/70">
              Bereits ausbezahlt
            </div>
            <div className="mt-3 text-2xl font-extrabold text-white">
              {chf(alreadyPaid)}
            </div>
            <div className="mt-2 text-xs text-white/60">
              Alle Payouts mit Status PAID.
            </div>
          </div>

          <div className="neo-card p-6 md:p-7">
            <div className="text-xs uppercase tracking-[0.18em] text-white/70">
              Verfügbar
            </div>

            <div className="mt-3 text-2xl font-extrabold text-white">
              {chf(available)}
            </div>

            <div className="mt-2 text-xs text-white/60">
              Verfügbar = Earnings − Paid − Pending Requests
            </div>

            {/* ✅ CTA Block: mehr Luft + Button bekommt pending */}
            <div className="mt-6">
             <RequestPayoutButton
  availableCents={available}
  pendingRequestedCents={pendingRequested}
/>

            </div>

            {/* ✅ Kein doppelter “Offener Request”-Text mehr hier.
                Das soll der Button sauber anzeigen (Request läuft / Offener Request / etc.). */}
          </div>
        </section>

        {/* History */}
        <section className="neo-card p-6 md:p-7">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg md:text-xl font-semibold text-white">
              Auszahlungshistorie
            </h2>
            <div className="text-xs text-white/60">{payouts.length} Einträge</div>
          </div>

          <div className="mt-6 space-y-4">
            {payouts.length === 0 ? (
              <p className="text-sm text-white/70">
                Noch keine Auszahlungen vorhanden.
              </p>
            ) : (
              payouts.map((p) => {
                const isPaid = p.status === "PAID";
                const isPending = p.status === "PENDING";

                return (
                  <div
                    key={p.id}
                    className="neo-card-soft px-5 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
                  >
                    <div className="space-y-1.5">
                      <div className="text-sm font-semibold text-white">
                        {chf(p.amountCents)}
                      </div>

                      <div className="text-xs text-white/65">
                        Erstellt: {p.createdAt.toLocaleDateString("de-CH")}
                        {p.paidAt
                          ? ` · Bezahlt: ${p.paidAt.toLocaleDateString("de-CH")}`
                          : ""}
                      </div>

                      {isPending ? (
                        <div className="text-xs text-white/55">
                          Wartet auf Freigabe durch Admin.
                        </div>
                      ) : null}
                    </div>

                    {/* ✅ Status Pill: groß, neumorph, klar lesbar */}
                    <span
                      className={[
                        "inline-flex items-center justify-center",
                        "rounded-full",
                        "px-6 py-3",
                        "min-w-[170px] sm:min-w-[190px]",
                        "text-[11px] md:text-xs font-extrabold tracking-[0.16em] uppercase",
                        "border border-white/20",
                        "text-white/90",
                        "shadow-[inset_-7px_-7px_14px_rgba(0,0,0,0.26),inset_7px_7px_14px_rgba(255,255,255,0.10)]",
                        isPaid
                          ? "bg-[linear-gradient(180deg,rgba(90,220,180,0.20),rgba(20,120,90,0.08))]"
                          : "bg-[linear-gradient(180deg,rgba(255,210,110,0.22),rgba(170,120,30,0.10))]",
                      ].join(" ")}
                    >
                      {p.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
