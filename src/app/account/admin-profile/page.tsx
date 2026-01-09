import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminProfileClient from "./AdminProfileClient";

export default async function Page() {
  const session = await getServerSession(auth);
  const user = session?.user as any;
  const userId = user?.id as string | undefined;
  if (!userId || user?.role !== "ADMIN") {
    return <div className="p-6">Zugriff verweigert.</div>;
  }

  const adminProfile = await prisma.adminProfile.findUnique({ where: { userId } });

  const initialData = adminProfile
    ? {
        displayName: adminProfile.displayName ?? "",
        signature: adminProfile.signature ?? "",
        notifyOnDownload: adminProfile.notifyOnDownload ?? true,
        notifyOnPayoutRequest: adminProfile.notifyOnPayoutRequest ?? true,
      }
    : null;

  return (
    <AdminProfileClient userId={userId} initialData={initialData} />
  );
}
