import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Map LEGACY enum values -> NEW enum values.
 *
 * ✅ You can safely add more legacy keys here as you discover them.
 * ✅ Keep the new target values only: WHITE_LABEL | MARKETPLACE
 *
 * Suggested semantics:
 * - "FREE"/"MIXED"/"PAID_VENDOR"/"SINGLE_VENDOR" -> WHITE_LABEL (own shop tenant)
 * - "MARKETPLACE" stays MARKETPLACE
 */
const MODE_MAP: Record<string, "WHITE_LABEL" | "MARKETPLACE"> = {
  // new / valid
  WHITE_LABEL: "WHITE_LABEL",
  MARKETPLACE: "MARKETPLACE",

  // legacy guesses (adjust if your product meaning differs)
  FREE: "WHITE_LABEL",
  MIXED: "WHITE_LABEL",
  PAID_VENDOR: "WHITE_LABEL",
  SINGLE_VENDOR: "WHITE_LABEL",
  MULTIVENDOR: "WHITE_LABEL",
  WHITE_LABEL_TENANT: "WHITE_LABEL",
};

async function main() {
  // Ensure new enum values exist in the DB so we can write them
  try {
    await prisma.$executeRawUnsafe(`DO $$\nBEGIN\n  ALTER TYPE "TenantMode" ADD VALUE IF NOT EXISTS 'WHITE_LABEL';\nEXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    console.log('Added enum value WHITE_LABEL (or already existed)');
  } catch (e: any) {
    console.log('Could not add enum value WHITE_LABEL (may already exist):', e?.message || e);
  }

  try {
    await prisma.$executeRawUnsafe(`DO $$\nBEGIN\n  ALTER TYPE "TenantMode" ADD VALUE IF NOT EXISTS 'MARKETPLACE';\nEXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    console.log('Added enum value MARKETPLACE (or already existed)');
  } catch (e: any) {
    console.log('Could not add enum value MARKETPLACE (may already exist):', e?.message || e);
  }

  // Read all distinct mode values as text (works even if Prisma enum is unhappy)
  const rows = await prisma.$queryRaw<{ mode: string; c: bigint }[]>`
    SELECT "mode"::text AS mode, COUNT(*)::bigint AS c
    FROM "Tenant"
    GROUP BY 1
    ORDER BY 2 DESC
  `;

  console.log("Before rewrite:", rows.map(r => ({ mode: r.mode, c: Number(r.c) })));

  const unknown = rows
    .map(r => r.mode)
    .filter(m => !MODE_MAP[m]);

  if (unknown.length) {
    console.error("❌ Unknown legacy modes (add to MODE_MAP):", Array.from(new Set(unknown)));
    process.exit(2);
  }

  // Rewrite each legacy value deterministically
  for (const r of rows) {
    const from = r.mode;
    const to = MODE_MAP[from];
    if (!to || from === to) continue;

    const res = await prisma.$executeRawUnsafe(
      `UPDATE "Tenant" SET "mode" = $1::"TenantMode" WHERE "mode"::text = $2`,
      to,
      from
    );
    console.log(`Rewrote mode ${from} -> ${to}:`, res);
  }

  const after = await prisma.$queryRaw<{ mode: string; c: bigint }[]>`
    SELECT "mode"::text AS mode, COUNT(*)::bigint AS c
    FROM "Tenant"
    GROUP BY 1
    ORDER BY 2 DESC
  `;

  console.log("After rewrite:", after.map(r => ({ mode: r.mode, c: Number(r.c) })));
  process.exit(0);
}

main()
  .catch((e) => {
    console.error("tenantmode-migrate error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

