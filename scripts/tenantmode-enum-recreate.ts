import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Recreate Postgres enum TenantMode to ONLY:
 *   - WHITE_LABEL
 *   - MARKETPLACE
 *
 * This drops any old enum variant names (e.g. PAID_VENDOR, MIXED, SINGLE_VENDOR).
 *
 * ✅ Run AFTER tenantmode:preflight is clean (only the new values exist).
 * ✅ Maintenance window recommended (ALTER TABLE TYPE).
 */
async function main() {
  // 1) Safety: ensure no legacy values remain (text query bypasses enum typing)
  const modes = await prisma.$queryRaw<{ mode: string; c: bigint }[]>`
    SELECT "mode"::text AS mode, COUNT(*)::bigint AS c
    FROM "Tenant"
    GROUP BY 1
    ORDER BY 2 DESC
  `;
  const modeList = modes.map((m) => m.mode);
  const allowed = new Set(["WHITE_LABEL", "MARKETPLACE"]);

  const bad = Array.from(new Set(modeList.filter((m) => !allowed.has(m))));
  if (bad.length) {
    console.error("❌ Aborting: legacy Tenant.mode values still exist:", bad);
    console.error("Run: npm run tenantmode:migrate  (and then preflight) first.");
    process.exit(2);
  }

  console.log("✅ Pre-check OK. Modes:", modes.map((m) => ({ mode: m.mode, c: Number(m.c) })));

  // 2) Recreate enum: TenantMode -> TenantMode_new -> rename
  const statements: string[] = [
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TenantMode_new') THEN
         CREATE TYPE "TenantMode_new" AS ENUM ('WHITE_LABEL', 'MARKETPLACE');
       END IF;
     END $$;`,

     // Remove default first so ALTER TYPE can proceed
     `ALTER TABLE "Tenant" ALTER COLUMN "mode" DROP DEFAULT;`,

     // Alter column type via text cast
     `ALTER TABLE "Tenant"
       ALTER COLUMN "mode"
       TYPE "TenantMode_new"
       USING ("mode"::text::"TenantMode_new");`,

    `DROP TYPE "TenantMode";`,

    `ALTER TYPE "TenantMode_new" RENAME TO "TenantMode";`,

    // Restore default to the new enum
    `ALTER TABLE "Tenant" ALTER COLUMN "mode" SET DEFAULT 'WHITE_LABEL';`,
  ];

  console.log("🚧 Recreating enum TenantMode (maintenance step)...");
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
  console.log("✅ Enum recreated successfully.");

  process.exit(0);
}

main()
  .catch((e) => {
    console.error("tenantmode-enum-recreate error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
