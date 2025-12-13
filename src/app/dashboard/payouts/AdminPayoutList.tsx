// src/app/dashboard/payouts/VendorPayoutList.tsx
"use client";

type VendorPayout = {
  id: string;
  amountCents: number;
  createdAt: string | Date;
  status: "PENDING" | "PAID" | string;
};

type VendorPayoutListProps = {
  payouts: VendorPayout[];
};

export default function VendorPayoutList({ payouts }: VendorPayoutListProps) {
  if (!payouts?.length) {
    return (
      <p className="text-xs text-[var(--color-text-muted)] italic">
        Keine Auszahlungen vorhanden.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {payouts.map((p) => {
        const amount = (Number(p.amountCents) / 100).toFixed(2);
        const date = new Date(p.createdAt).toLocaleString("de-CH");
        const isPaid = p.status === "PAID";

        return (
          <div
            key={p.id}
            className="neo-card-soft px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                {amount} CHF
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span>Erstellt: {date}</span>
                <span>•</span>
                <span>
                  Status:{" "}
                  <span className={isPaid ? "text-emerald-300" : "text-amber-300"}>
                    {isPaid ? "Ausgezahlt" : "Ausstehend"}
                  </span>
                </span>
              </div>
            </div>

            <span
              className={
                "rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase " +
                (isPaid
                  ? "bg-emerald-500/15 text-emerald-200"
                  : "bg-amber-500/15 text-amber-200")
              }
            >
              {isPaid ? "PAID" : "PENDING"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
