import { prisma } from "@/lib/prisma";
import FilterBar from "@/components/analytics/FilterBar";
import RevenueChart from "@/components/analytics/RevenueChart";
import ProductDownloadPie from "@/components/analytics/ProductDownloadPie";

export default async function VendorAnalyticsPage() {
  const sales = await prisma.order.findMany({
    include: {
      product: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Analytics</h1>
      <FilterBar />
      <RevenueChart sales={sales} />
      <ProductDownloadPie sales={sales} />
    </div>
  );
}
