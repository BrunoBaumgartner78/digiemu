// src/lib/withAdminLoginAudit.ts
import { logAuditEvent } from "@/lib/logAuditEvent";

export async function withAdminLoginAudit(user: any, req?: any) {
  if (!user || user.role !== "ADMIN") return;
  // IP/UserAgent extraction (if available)
  let ip = undefined;
  let userAgent = undefined;
  if (req) {
    ip = req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"] || req.socket?.remoteAddress;
    userAgent = req.headers?.["user-agent"];
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
