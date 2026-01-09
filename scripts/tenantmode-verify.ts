import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ final erlaubte Modi (intern englisch)
const ALLOWED = new Set(["WHITE_LABEL", "MARKETPLACE"]);

async function main() {
  // ✅ Enum-safe: immer über TEXT vergleichen/ausgeben
  const counts = await prisma.$queryRaw<{ mode: string; c: bigint }[]>`
    SELECT "mode"::text AS mode, COUNT(*)::bigint AS c
    FROM "Tenant"
    GROUP BY 1
    ORDER BY 2 DESC
  `;

  console.log("Tenant.mode counts:", counts.map((r) => ({ mode: r.mode, c: Number(r.c) })));

  const unknown = counts.filter((r) => !ALLOWED.has(String(r.mode || "").toUpperCase()));

  if (unknown.length > 0) {
    console.error("❌ Unknown Tenant.mode value(s) in DB:", unknown);
    process.exit(3);
  }

  // optional: check enum labels in DB (debug)
  const labels = await prisma.$queryRaw<{ label: string }[]>`
    SELECT e.enumlabel AS label
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'TenantMode'
    ORDER BY e.enumsortorder
  `;
  console.log("DB enum TenantMode labels:", labels.map((x) => x.label));

  process.exit(0);
}

main()
  .catch((e) => {
    console.error("❌ tenantmode-verify error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

