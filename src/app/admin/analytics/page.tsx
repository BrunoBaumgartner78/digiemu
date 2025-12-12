import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminAnalyticsClient from "./AdminAnalyticsClient";

export const metadata = {
  title: "Admin Analytics – DigiEmu",
  description: "Umsatz- und Bestell-Analytics für Admins.",
};

type SearchParams = { [key: string]: string | string[] | undefined };

function parseDaysParam(searchParams?: SearchParams): number | null {
  const days = searchParams?.days;
  if (days === "7" || days === "30" || days === "90") return parseInt(days);
  return null;
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams?: SearchParams }) {
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

  // Date filter
  const days = parseDaysParam(searchParams);
  let fromDate: Date | undefined = undefined;
  if (days) {
    fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    fromDate.setDate(fromDate.getDate() - days + 1);
  }

  // Orders laden (filtered)
  const orders = await prisma.order.findMany({
    where: fromDate ? { createdAt: { gte: fromDate } } : {},
    include: { product: true, buyer: true },
    orderBy: { createdAt: "desc" },
    take: 25,
  });


  // KPIs & Aggregationen
  const completedOrders = orders.filter(o => o.status === "COMPLETED");
  const totalOrders = orders.length;
  const totalRevenueCents = completedOrders.reduce((sum, o) => sum + o.amountCents, 0);

  // Render analytics client
  return <AdminAnalyticsClient />;
}
