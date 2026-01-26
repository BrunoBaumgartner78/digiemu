import { prisma } from "@/lib/prisma";

export async function blockedUserGuard(sessionUser: unknown, action = "Aktion") {
  const email = (sessionUser as { email?: unknown })?.email;
  if (typeof email !== "string" || !email) {
    throw new Error(`Unauthenticated`);
  }

  const dbUser = await prisma.user.findUnique({
    where: { email },
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
