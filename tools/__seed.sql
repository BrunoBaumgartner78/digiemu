CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "Tenant" ("id","key","name","mode","createdAt","updatedAt")
VALUES (gen_random_uuid(), 'DEFAULT', 'DEFAULT', 'MARKETPLACE', NOW(), NOW())
ON CONFLICT ("key") DO NOTHING;
