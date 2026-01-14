// Force request-time rendering (do NOT SSG this page)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { cookies } from "next/headers";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import FilterBar from "@/components/analytics/FilterBar";
import RevenueChart from "@/components/analytics/RevenueChart";
import ProductDownloadPie from "@/components/analytics/ProductDownloadPie";

export default async function AnalyticsPage() {
  cookies(); // forces request-time rendering

  const sales = await prisma.order.findMany({
    include: { product: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Analytics</h1>

      <Suspense fallback={null}>
        <FilterBar />
      </Suspense>

      <RevenueChart sales={sales} />
      <ProductDownloadPie sales={sales} />
    </div>
  );
}
