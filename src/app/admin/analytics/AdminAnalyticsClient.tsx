"use client";

type AdminAnalyticsClientProps = {
  totalOrders: number;
  revenuePaidOrCompleted: number; // Umsatz aus paid/completed
  paidOrCompletedOrders: number;
  avgOrderValue: number;
};

export default function AdminAnalyticsClient({
  totalOrders,
  revenuePaidOrCompleted,
  paidOrCompletedOrders,
  avgOrderValue,
}: AdminAnalyticsClientProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="neumorph-card p-5">
          <p className="text-sm opacity-70">Bestellungen</p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>

        <div className="neumorph-card p-5">
          <p className="text-sm opacity-70">Paid/Completed</p>
          <p className="text-2xl font-bold">{paidOrCompletedOrders}</p>
        </div>

        <div className="neumorph-card p-5">
          <p className="text-sm opacity-70">Umsatz (paid/completed)</p>
          <p className="text-2xl font-bold">
            {Number.isFinite(revenuePaidOrCompleted)
              ? revenuePaidOrCompleted.toFixed(2)
              : "0.00"}
          </p>
        </div>

        <div className="neumorph-card p-5">
          <p className="text-sm opacity-70">Ø Bestellwert</p>
          <p className="text-2xl font-bold">
            {Number.isFinite(avgOrderValue) ? avgOrderValue.toFixed(2) : "0.00"}
          </p>
        </div>
      </div>
    </div>
  );
}
