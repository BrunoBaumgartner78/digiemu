// src/lib/withAdminLoginAudit.ts
import { logAuditEvent } from "@/lib/logAuditEvent";

type AuditUser = { id: string; role?: "ADMIN" | "VENDOR" | "BUYER"; email?: string | null };

export async function withAdminLoginAudit(user: AuditUser, req?: { headers?: Record<string, unknown> & { get?: (k: string) => unknown }; socket?: { remoteAddress?: string } }) {
  if (!user || user.role !== "ADMIN") return;
  // IP/UserAgent extraction (if available)
  let ip: string | undefined = undefined;
  let userAgent: string | undefined = undefined;
  if (req) {
    // Support both plain object headers and Headers-like interface without casting to `any`
    const h = req.headers as unknown;
    if (h && typeof (h as { get?: unknown }).get === "function") {
      // Headers-like
      const getter = (h as { get: (k: string) => unknown }).get;
      ip = (getter("x-forwarded-for") as string | undefined) ?? (getter("x-real-ip") as string | undefined);
      userAgent = getter("user-agent") as string | undefined;
    } else if (h && typeof h === "object") {
      // Plain object
      const obj = h as Record<string, unknown>;
      ip = (obj["x-forwarded-for"] as string | undefined) ?? (obj["x-real-ip"] as string | undefined);
      userAgent = obj["user-agent"] as string | undefined;
    }
    ip = ip ?? req.socket?.remoteAddress;
  }
  await logAuditEvent({
    actorId: user.id,
    action: "ADMIN_LOGIN",
    targetType: "ADMIN",
    targetId: user.id,
    meta: { ip, userAgent },
    ipAddress: ip,
    userAgent,
  });
}
