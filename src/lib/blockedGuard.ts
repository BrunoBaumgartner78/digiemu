import { prisma } from "@/lib/prisma";

export async function requireNotBlocked(user: any) {
  if (!user?.email) {
    return { ok: false, status: 401, message: "Nicht eingeloggt" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: {
      id: true,
      email: true,
      role: true,
      isBlocked: true,
    },
  });

  if (!dbUser) {
    return { ok: false, status: 404, message: "User nicht gefunden" };
  }

  if (dbUser.isBlocked) {
    return {
      ok: false,
      status: 403,
      message: "Dein Account ist gesperrt.",
    };
  }

  return { ok: true };
}
