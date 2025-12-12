import { prisma } from "@/lib/prisma";

export async function blockedUserGuard(sessionUser: any, action = "Aktion") {
  if (!sessionUser?.email) {
    throw new Error(`Unauthenticated`);
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: {
      id: true,
      email: true,
      role: true,
      isBlocked: true,
    },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  if (dbUser.isBlocked) {
    throw new Error(
      `Dein Account ist gesperrt und darf diese Aktion nicht ausführen (${action}).`
    );
  }

  return dbUser;
}
