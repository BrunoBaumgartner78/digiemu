import { prisma } from "@/lib/prisma";

type Meta = Record<string, any>;

export async function adminAudit(params: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  meta?: Meta;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId ?? null,
        meta: params.meta ?? undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch {
    // never block admin flow due to logging
  }
}
