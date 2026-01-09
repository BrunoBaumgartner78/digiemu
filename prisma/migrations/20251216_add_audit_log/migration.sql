-- prisma/migrations/20251216_add_audit_log/migration.sql
-- Add AuditLog model for admin security & audit logging
CREATE TABLE "AuditLog" (
    "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "actorId"    TEXT NOT NULL,
    "action"     TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId"   TEXT NOT NULL,
    "meta"       JSONB,
    "ipAddress"  TEXT,
    "userAgent"  TEXT,
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT
);
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt" DESC);
CREATE INDEX "AuditLog_action_idx" ON "AuditLog" ("action");
CREATE INDEX "AuditLog_targetType_idx" ON "AuditLog" ("targetType");
