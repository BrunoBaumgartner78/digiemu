// src/lib/security/audit.ts
export type AuditEvent = {
  actorId?: string | null;
  action: string;
  targetUserId?: string | null;
  targetProductId?: string | null;
  meta?: Record<string, unknown>;
};

export async function logAudit(_e: AuditEvent) {
  // noop in MVP (optional: persist later)
  return;
}
