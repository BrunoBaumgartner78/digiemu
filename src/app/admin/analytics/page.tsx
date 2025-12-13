import AdminAnalyticsClient from "./AdminAnalyticsClient";

export default async function Page() {
  // ...deine serverseitigen Berechnungen
  const totalOrders = 12;
  const paidOrCompletedOrders = 9;
  const revenuePaidOrCompleted = 123.45;
  const avgOrderValue = 13.72;

  return (
    <AdminAnalyticsClient
      totalOrders={totalOrders}
      paidOrCompletedOrders={paidOrCompletedOrders}
      revenuePaidOrCompleted={revenuePaidOrCompleted}
      avgOrderValue={avgOrderValue}
    />
  );
}
