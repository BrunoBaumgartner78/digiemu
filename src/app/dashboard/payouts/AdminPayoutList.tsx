"use client";

type VendorPayout = {
  id: string;
  amountCents: number;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | string;
  createdAt: string | Date;
  paidAt?: string | Date | null;
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
        const amount = (p.amountCents / 100).toFixed(2);
        const created = new Date(p.createdAt).toLocaleString("de-CH");
        const paidAt = p.paidAt ? new Date(p.paidAt).toLocaleString("de-CH") : null;

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
                <span>Erstellt: {created}</span>
                <span>•</span>
                <span>
                  Status:{" "}
                  <span className={isPaid ? "text-emerald-300" : "text-amber-300"}>
                    {isPaid ? "Ausgezahlt" : "Ausstehend"}
                  </span>
                </span>
                {paidAt && (
                  <>
                    <span>•</span>
                    <span>Bezahlt: {paidAt}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
