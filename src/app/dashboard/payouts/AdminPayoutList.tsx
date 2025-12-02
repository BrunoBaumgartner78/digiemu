import type { AdminPayout } from "@/types";

type AdminPayoutListProps = {
  payouts: AdminPayout[];
  onMarkPaid: (id: string) => Promise<void>;
};

export default function AdminPayoutList({
  payouts,
  onMarkPaid,
}: AdminPayoutListProps) {
  if (!payouts.length)
    return <p className="text-gray-600">Keine Auszahlungen vorhanden.</p>;

  return (
    <div className="space-y-4">
      {payouts.map((p) => (
        <div
          key={p.id}
          className="rounded-xl p-4 bg-white shadow-lg border border-gray-200 flex justify-between items-center"
        >
          <div>
            <div className="font-semibold">
              {p.amountCents / 100} CHF – {p.vendor.email}
            </div>

            <div className="text-sm text-gray-600">
              Status:{" "}
              {p.status === "PAID" ? (
                <span className="text-green-600">Ausgezahlt</span>
              ) : (
                <span className="text-orange-600">Ausstehend</span>
              )}
            </div>

            <div className="text-xs text-gray-500">
              {new Date(p.createdAt).toLocaleDateString("de-CH")}
            </div>
          </div>

          {p.status !== "PAID" && (
            <button
              onClick={() => onMarkPaid(p.id)}
              className="px-4 py-2 rounded-full bg-blue-600 text-white"
            >
              Markieren als bezahlt
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
