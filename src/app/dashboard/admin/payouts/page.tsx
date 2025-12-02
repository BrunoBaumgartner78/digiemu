import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminPayoutList from "@/components/dashboard/AdminPayoutList";

export default async function AdminPayoutPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const payouts = await prisma.payout.findMany({
    include: { vendor: true },
    orderBy: { createdAt: "desc" }
  });

  return <AdminPayoutList payouts={payouts} />;
}
