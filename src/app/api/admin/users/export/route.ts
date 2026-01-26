import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/requireAdminApi";

export const runtime = "nodejs"; // sicher für CSV / Buffer / etc.

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  // RFC4180-ish
  if (/[",\n\r;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  await requireAdminApi();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isBlocked: true,
      createdAt: true,
    },
  });

  const header = ["id", "email", "name", "role", "isBlocked", "createdAt"];
  const lines = [
    header.join(";"),
    ...users.map((u) =>
      [
        u.id,
        u.email,
        u.name ?? "",
        u.role,
        String(u.isBlocked),
        u.createdAt.toISOString(),
      ]
        .map(csvEscape)
        .join(";")
    ),
  ];

  const csv = "\uFEFF" + lines.join("\n"); // BOM für Excel

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
