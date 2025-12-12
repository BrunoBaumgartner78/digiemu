// z.B. src/components/admin/AdminPayoutList.tsx
import type { AdminPayout } from "@/types";

type AdminPayoutListProps = {
  payouts: AdminPayout[];
  onMarkPaid: (id: string) => Promise<void>;
};

export default function AdminPayoutList({
  payouts,
  onMarkPaid,
}: AdminPayoutListProps) {
  if (!payouts.length) {
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
        const date = new Date(p.createdAt).toLocaleString("de-CH");
        const isPaid = p.status === "PAID";

        return (
          <div
            key={p.id}
            className="neo-card-soft px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                {amount} CHF – {p.vendor.email}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span>Erstellt: {date}</span>
                <span>•</span>
                <span>
                  Status:{" "}
                  <span
                    className={
                      isPaid ? "text-emerald-300" : "text-amber-300"
                    }
                  >
                    {isPaid ? "Ausgezahlt" : "Ausstehend"}
                  </span>
                </span>
              </div>
            </div>

            {!isPaid && (
              <button
                onClick={() => onMarkPaid(p.id)}
                className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.12em] uppercase
                 bg-gradient-to-r from-emerald-500 to-blue-500
                 text-white shadow-[0_18px_40px_rgba(16,185,129,0.45)]
                 hover:shadow-[0_22px_55px_rgba(16,185,129,0.65)]
                 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                Markieren als bezahlt
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
