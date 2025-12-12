// z.B. src/components/vendor/VendorPayoutList.tsx
import type { VendorPayout } from "@/types";

type VendorPayoutListProps = {
  payouts: VendorPayout[];
};

export default function VendorPayoutList({ payouts }: VendorPayoutListProps) {
  if (!payouts.length) {
    return (
      <p className="text-xs text-[var(--color-text-muted)] italic">
        Noch keine Auszahlungen.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {payouts.map((payout) => {
        const amount = (payout.amountCents / 100).toFixed(2);
        const date = new Date(payout.createdAt).toLocaleString("de-CH");
        const isPaid = payout.status === "PAID";

        return (
          <div
            key={payout.id}
            className="neo-card-soft px-4 py-3 flex items-center justify-between gap-4 text-sm"
          >
            <div className="flex flex-col gap-1">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Auszahlung
              </div>
              <div className="text-base font-semibold text-[var(--color-text-primary)]">
                {amount} CHF
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)]">
                {date}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase ${
                  isPaid
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/40"
                    : "bg-amber-500/12 text-amber-200 border border-amber-400/45"
                }`}
              >
                {isPaid ? "Bezahlt" : "Ausstehend"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
