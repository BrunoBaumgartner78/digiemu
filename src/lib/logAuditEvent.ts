// src/lib/logAuditEvent.ts
import { prisma } from "@/lib/prisma";

export type AuditLogParams = {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  meta? : unknown;
  ipAddress?: string;
  userAgent?: string;
};

export async function logAuditEvent(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        meta: params.meta ? params.meta : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (_e) {
    // Logging darf Core-Flow nicht blockieren
    console.error("[AuditLog] Logging failed", _e);
  }
}
