import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VendorDashboardClient from "./VendorDashboardClient";

export const dynamic = "force-dynamic";

export default async function VendorPage() {
  const session = await getServerSession(auth);
  if (!session) redirect("/login");

  if (session.user.role !== "VENDOR") {
    if (session.user.role === "ADMIN") redirect("/admin");
    redirect("/marketplace");
  }

  const payouts = await prisma.payout.findMany({
    where: { vendorId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, amountCents: true, status: true, createdAt: true },
  });

  return <VendorDashboardClient payouts={payouts} />;
}
