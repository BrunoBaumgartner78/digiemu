// src/app/dashboard/payouts/VendorPayoutList.tsx
"use client";


type VendorPayout = {
  id: string;
  amountCents: number;
  status: "PENDING" | "PAID";
  createdAt: string | Date;
  note?: string | null;
};

type VendorPayoutListProps = {
  payouts: VendorPayout[];
};

export default function VendorPayoutList({ payouts }: VendorPayoutListProps) {
  if (!payouts?.length) {
    return (
      <p className="text-xs text-[var(--color-text-muted)] italic">
        Noch keine Auszahlungen vorhanden.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {payouts.map((p) => {
        const amount = (p.amountCents / 100).toFixed(2);
        const date = new Date(p.createdAt).toLocaleString("de-CH");
        const isPaid = p.status === "PAID";

        return (
          <div key={p.id} className="neo-card-soft px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                {amount} CHF
              </div>

              <div className="text-xs">
                <span className={isPaid ? "text-emerald-300" : "text-amber-300"}>
                  {isPaid ? "Ausgezahlt" : "Ausstehend"}
                </span>
              </div>
            </div>

            <div className="text-xs text-[var(--color-text-muted)]">
              Erstellt: {date}
            </div>

            {p.note ? (
              <div className="text-xs text-[var(--color-text-muted)] italic">
                {p.note}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
