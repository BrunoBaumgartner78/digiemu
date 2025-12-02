import type { VendorPayout } from "@/types";

type VendorPayoutListProps = {
  payouts: VendorPayout[];
};

export default function VendorPayoutList({ payouts }: VendorPayoutListProps) {
  if (!payouts.length)
    return <p className="text-gray-600">Keine Auszahlungen vorhanden.</p>;

  return (
    <div className="space-y-4">
      {payouts.map((payout) => (
        <div
          key={payout.id}
          className="rounded-xl p-4 bg-white shadow-lg border border-gray-200"
        >
          <div className="font-semibold">{payout.amountCents / 100} CHF</div>

          <div className="text-sm text-gray-600">
            Status:{" "}
            {payout.status === "PAID" ? (
              <span className="text-green-600">Ausgezahlt</span>
            ) : (
              <span className="text-orange-600">Ausstehend</span>
            )}
          </div>

          <div className="text-xs text-gray-500">
            {new Date(payout.createdAt).toLocaleDateString("de-CH")}
          </div>
        </div>
      ))}
    </div>
  );
}
