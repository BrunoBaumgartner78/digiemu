import { redirect } from "next/navigation";
import { requireSessionPage } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import VendorDashboardClient from "./VendorDashboardClient";

export const dynamic = "force-dynamic";

export default async function VendorPage() {
  const session = await requireSessionPage();
  if (!session) redirect("/login");

  if (session.user.role === "ADMIN") redirect("/admin");
  if (!session.user.id) redirect("/login");

  const vp = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { status: true },
  });

  if (!vp) {
    redirect("/become-seller");
  }

  const vendorStatus = (vp?.status as string | undefined) ?? "PENDING";

  if (vendorStatus === "BLOCKED" || session.user.isBlocked) {
    redirect("/sell?status=blocked");
  }

  if (vendorStatus !== "APPROVED") {
    redirect("/sell?status=pending");
  }

  if (session.user.role !== "VENDOR") {
    redirect("/sell?status=pending");
  }

  const payouts = await prisma.payout.findMany({
    where: { vendorId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, amountCents: true, status: true, createdAt: true },
  });

  return (
    <>
      <VendorDashboardClient payouts={payouts} />
    </>
  );
}
