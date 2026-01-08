import { prisma } from "@/lib/prisma";

export async function logAudit(event: {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  meta?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: event.actorId ?? "system",
        action: event.action,
        targetType: event.targetType,
        targetId: event.targetId ?? null,
        meta: event.meta ? JSON.stringify(event.meta) : undefined,
      },
    });
  } catch (err) {
    // best-effort: do not throw on audit errors
    console.error("audit log error", err);
  }
}

export default { logAudit };
