import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminAnalyticsClient from "./AdminAnalyticsClient";
import type { RevenuePoint, TopProductPoint } from "./AdminAnalyticsClient";

export const metadata = {
  title: "Admin Analytics – DigiEmu",
  description: "Umsatz- und Bestell-Analytics für Admins.",
};

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="neumorph-card max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-bold mb-2">Kein Zugriff</h1>
          <p className="mb-4">Nur Admins dürfen diese Seite sehen.</p>
          <Link href="/" className="neobtn">Zur Startseite</Link>
        </div>
      </main>
    );
  }

  const orders = await prisma.order.findMany({
    include: { product: true },
  });

  const completed = orders.filter(
    (o) => o.status === "PAID" || o.status === "COMPLETED"
  );

  const revenueOverTime: RevenuePoint[] = [];
  const topProducts: TopProductPoint[] = [];

  return (
    <AdminAnalyticsClient
      revenueOverTime={revenueOverTime}
      topProducts={topProducts}
    />
  );
}
