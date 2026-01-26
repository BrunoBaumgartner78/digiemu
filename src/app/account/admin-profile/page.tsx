import { requireAdminPage } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import AdminProfileClient from "./AdminProfileClient";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/sessionUser";

export default async function Page() {
  const session = await requireAdminPage();
  const user = requireUser(session?.user);
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
