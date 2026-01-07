import { prisma } from "@/lib/prisma";

export type E2EAdmin = { id: string; email: string; role: "ADMIN" };

function isEnabled() {
  return process.env.NODE_ENV !== "production" && !!process.env.E2E_ADMIN_SECRET;
}

export async function getE2EAdminFromRequest(req: Request): Promise<E2EAdmin | null> {
  if (!isEnabled()) return null;
  const secret = req.headers.get("x-e2e-secret") || "";
  const flag = req.headers.get("x-e2e-admin") || "";
  const email = req.headers.get("x-e2e-email") || process.env.E2E_ADMIN_EMAIL || "";

  // debug logs (dev-only)
  try {
    // eslint-disable-next-line no-console
    console.debug("E2E admin check", { enabled: isEnabled(), flag, providedSecret: !!secret, envSecret: !!process.env.E2E_ADMIN_SECRET, email });
  } catch (e) {}

  if (flag !== "1") return null;
  if (!process.env.E2E_ADMIN_SECRET || secret !== process.env.E2E_ADMIN_SECRET) return null;

  if (!email) return null;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, role: true } });
  if (!user) return null;
  if (user.role !== "ADMIN") return null;

  return { id: user.id, email: user.email!, role: "ADMIN" };
}
