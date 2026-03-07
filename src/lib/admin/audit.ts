import { adminAudit } from "@/lib/admin/adminAudit";

type AuditSnapshot = Record<string, unknown> | null | undefined;

export async function auditAdminMutation(params: {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: AuditSnapshot;
  after?: AuditSnapshot;
  note?: string | null;
  request?: Request;
}) {
  const ipAddress =
    params.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    params.request?.headers.get("x-real-ip") ??
    null;
  const userAgent = params.request?.headers.get("user-agent") ?? null;

  await adminAudit({
    actorId: params.adminUserId,
    action: params.action,
    targetType: params.entityType,
    targetId: params.entityId ?? null,
    meta: {
      before: params.before ?? null,
      after: params.after ?? null,
      note: params.note ?? null,
    },
    ipAddress,
    userAgent,
  });
}