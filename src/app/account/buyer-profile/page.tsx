import { requireSessionPage } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import BuyerProfileClient from "./BuyerProfileClient";

export default async function Page() {
  const session = await requireSessionPage();
  const userId = (session?.user as any)?.id as string | undefined;

  const buyerProfile = userId ? await prisma.buyerProfile.findUnique({ where: { userId } }) : null;

  const initialData = buyerProfile
    ? {
        displayName: buyerProfile.displayName ?? "",
        bio: buyerProfile.bio ?? "",
        avatarUrl: buyerProfile.avatarUrl ?? "",
        isPublic: buyerProfile.isPublic ?? false,
      }
    : null;

  return (
    <BuyerProfileClient userId={userId ?? ""} initialData={initialData} />
  );
}
