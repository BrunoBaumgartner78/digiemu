import { redirect } from "next/navigation";
import { requireSessionPage } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import VendorDashboardClient from "./VendorDashboardClient";

export const dynamic = "force-dynamic";

export default async function VendorPage() {
  const session = await requireSessionPage();
  if (!session) redirect("/login");

  if (session.user.role !== "VENDOR") {
    if (session.user.role === "ADMIN") redirect("/admin");
    redirect("/marketplace");
  }

  // Vendor status check
  const vp = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { status: true },
  });

  const vendorStatus = (vp?.status as string | undefined) ?? "PENDING";

  const payouts = await prisma.payout.findMany({
    where: { vendorId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, amountCents: true, status: true, createdAt: true },
  });

  return (
    <>
      {vendorStatus !== "APPROVED" && (
        <div className="neumorph-card p-4 mb-4">
          <div className="text-sm font-semibold">
            {vendorStatus === "PENDING"
              ? "Dein Verkäuferkonto wartet auf Freischaltung durch Admin."
              : "Dein Verkäuferkonto ist gesperrt. Bitte kontaktiere den Support."}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            Du kannst Produkte vorbereiten, aber sie werden erst nach Freigabe sichtbar.
          </div>
        </div>
      )}
      <VendorDashboardClient payouts={payouts} />
    </>
  );
}
