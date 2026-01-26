import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/guards/authz";

export async function requireAdminContext() {
  // Expectation: requireAdminApi() ensures access and returns something with userId,
  // but if it returns void in your project, we fall back to reading from session in there.
  const session: any = await requireAdminApi();

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;
  const ua = h.get("user-agent") ?? null;

  const actorId = session?.user?.id ?? session?.userId ?? session?.id;
  if (!actorId) {
    // keep strict: no actor id means something is wrong with guard/session
    throw new Error("Admin session missing actor id");
  }

  return { actorId, ipAddress: ip, userAgent: ua };
}
