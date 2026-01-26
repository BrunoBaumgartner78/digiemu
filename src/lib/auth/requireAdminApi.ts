import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

/**
 * For App Router API routes: enforce ADMIN access.
 * Throws a Response with 401/403 so route handlers can just call it.
 */
export async function requireAdminApi() {
  const session = await getServerSession(authOptions);

  const role = (session as any)?.user?.role;
  const isBlocked = (session as any)?.user?.isBlocked;

  if (!session?.user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  if (isBlocked) {
    throw new Response("Blocked", { status: 403 });
  }
  if (role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }

  return session;
}
