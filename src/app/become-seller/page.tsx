// src/app/become-seller/page.tsx
import { getServerSession } from "next-auth";

import { auth } from "@/lib/auth";

import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant-context";
import { redirect } from "next/navigation";

export default async function BecomeSellerPage() {
  const session = await getServerSession(auth);

  if (!session || !session.user?.id) {
    redirect("/login?callbackUrl=/become-seller");
  }

  const userId = session.user.id;

  // Prüfen, ob schon VendorProfile existiert (tenant-scoped)
  const { tenantKey } = await currentTenant();

  let vendorProfile = await prisma.vendorProfile.findUnique({
    where: { tenantKey_userId: { tenantKey, userId } as any },
  });

  if (!vendorProfile) {
    vendorProfile = await prisma.vendorProfile.create({
      data: {
        userId,
        tenantKey,
        displayName: session.user.name ?? "Neuer Verkäufer",
        bio: "",
      },
    });

    // User-Rolle auf VENDOR setzen (falls dein Schema das so vorsieht)
    await prisma.user.update({
      where: { id: userId },
      data: { role: "VENDOR" },
    });
  }

  // Direkt ins Vendor-Dashboard
  redirect("/dashboard/vendor");
}
