// src/app/become-seller/page.tsx
import { requireSessionPage } from "@/lib/guards/authz";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BecomeSellerPage() {
  const session = await requireSessionPage();

  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/become-seller");
  }

  const userId = session.user.id;

  // Prüfen, ob schon VendorProfile existiert
  let vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId },
  });

  if (!vendorProfile) {
    // PENDING seller remains BUYER until approved.
    vendorProfile = await prisma.vendorProfile.create({
      data: {
        userId,
        displayName: session.user.name ?? "Neuer Verkäufer",
        bio: "",
        status: "PENDING",
      },
    });
    // Vendor role is granted only after admin approval.
  }

  // Do not redirect BUYER+PENDING users into vendor-only areas.
  if (vendorProfile.status === "BLOCKED") {
    redirect("/sell?status=blocked");
  }
  if (vendorProfile.status !== "APPROVED") {
    redirect("/sell?status=pending");
  }
  redirect("/dashboard/vendor");
}
