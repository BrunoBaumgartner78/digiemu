import { prisma } from "@/lib/prisma";

export async function GET() {
  const userCount = await prisma.user.count();

  return Response.json({
    ok: true,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    userCount,
  });
}
