const { PrismaClient } = require("@prisma/client");

const p = new PrismaClient();

(async () => {
  const rows = await p.product.groupBy({
    by: ["status"],
    _count: { _all: true },
    orderBy: { status: "asc" },
  });

  console.table(rows.map((r) => ({ status: r.status, cnt: r._count._all })));

  // if enum mismatch exists, this may throw
  try {
    const approvedCnt = await p.product.count({ where: { status: "APPROVED" } });
    console.log("approved_cnt:", approvedCnt);
  } catch (e) {
    console.log("approved_cnt: ERROR (expected if enum doesn't allow APPROVED)");
    console.log(String(e));
  }

  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
