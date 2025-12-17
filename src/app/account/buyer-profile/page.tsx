import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BuyerProfileClient from "./BuyerProfileClient";

export default async function Page() {
  const session = await getServerSession(auth);
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
