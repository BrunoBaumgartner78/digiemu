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
    vendorProfile = await prisma.vendorProfile.create({
      data: {
        userId,
        displayName: session.user.name ?? "Neuer Verkäufer",
        bio: "",
        status: "PENDING",
      },
    });

    // User-Rolle auf VENDOR setzen (falls dein Schema das so vorsieht)
    await prisma.user.update({
      where: { id: userId },
      data: { role: "VENDOR" },
    });
  }

  // Direkt ins Vendor-Dashboard
  if (vendorProfile.status !== "APPROVED") {
    redirect("/dashboard/vendor?status=pending");
  }
  redirect("/dashboard/vendor");
}
