import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/guards/authz";
import { redirect } from "next/navigation";
import AdminPayoutList from "@/components/dashboard/AdminPayoutList";

export default async function AdminPayoutPage() {
  const session = await requireAdminPage();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const payouts = await prisma.payout.findMany({
    include: { vendor: true },
    orderBy: { createdAt: "desc" }
  });

  // Cast payouts to the expected type for AdminPayoutList
  const mappedPayouts = payouts.map((p: unknown) => {
    const pp = p as any;
    return {
      ...pp,
      status: pp.status as "PENDING" | "PAID",
      vendor: { email: pp.vendor.email },
    };
  });
  return <AdminPayoutList payouts={mappedPayouts} />;
}
