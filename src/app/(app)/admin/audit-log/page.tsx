import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Prisma } from "@prisma/client";
import { AdminAuditLogRow } from "@/lib/admin-types";

export const metadata = {
  title: "Admin Audit Log – DigiEmu",
  description: "Sicherheits- und Audit-Log für Admins.",
};

export default async function AdminAuditLogPage({ searchParams }: { searchParams?: { action?: string; targetType?: string } }) {
  const session = await getServerSession(auth);
  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="neumorph-card p-8 text-center max-w-md">
          <h1 className="text-xl font-bold mb-2">Zugriff verweigert</h1>
          <p className="opacity-80">Nur Administratoren dürfen dieses Panel sehen.</p>
        </div>
      </div>
    );
  }

  const action = searchParams?.action ?? "ALL";
  const targetType = searchParams?.targetType ?? "ALL";
  const where: Prisma.AuditLogWhereInput = {};
  if (action !== "ALL") where.action = action;
  if (targetType !== "ALL") where.targetType = targetType;

  const logs = (await prisma.auditLog.findMany({
    where,
    include: { actor: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })) as AdminAuditLogRow[];

  // Für Filteroptionen alle Actions/TargetTypes holen
  const allActions = await prisma.auditLog.findMany({ select: { action: true }, distinct: ["action"] });
  const allTargetTypes = await prisma.auditLog.findMany({ select: { targetType: true }, distinct: ["targetType"] });

  return (
    <div className="admin-shell">
      <div className="admin-breadcrumb">
        <span>Admin</span>
        <span className="admin-breadcrumb-dot" />
        <span>Audit Log</span>
      </div>
      <header className="admin-header">
        <div className="admin-kicker">DigiEmu · Admin</div>
        <h1 className="admin-title">Security & Audit Log</h1>
        <p className="admin-subtitle">Alle sicherheitsrelevanten Admin-Aktionen im Überblick.</p>
      </header>
      <section className="mb-6">
        <form className="flex flex-wrap gap-2 items-center">
          <label>Aktion:
            <select name="action" defaultValue={action} className="input-neu ml-2">
              <option value="ALL">Alle</option>
              {allActions.map(a => <option key={a.action} value={a.action}>{a.action}</option>)}
            </select>
          </label>
          <label>Zieltyp:
            <select name="targetType" defaultValue={targetType} className="input-neu ml-2">
              <option value="ALL">Alle</option>
              {allTargetTypes.map(t => <option key={t.targetType} value={t.targetType}>{t.targetType}</option>)}
            </select>
          </label>
          <button type="submit" className="neobtn-sm">Filtern</button>
        </form>
      </section>
      {logs.length === 0 ? (
        <div className="admin-card text-[var(--text-muted)]">Noch keine Audit-Einträge.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[900px]">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Admin</th>
                <th>Aktion</th>
                <th>Ziel</th>
                <th>Meta</th>
                <th>IP</th>
                <th>User Agent</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString("de-CH")}</td>
                  <td>{log.actor?.email || log.actorId}</td>
                  <td><StatusBadge status={log.action} /></td>
                  <td>
                    {log.targetType}{" "}
                    <span className="font-mono text-xs">
                      {log.targetId ? `${log.targetId.slice(0, 8)}…` : "—"}
                    </span>
                  </td>
                      <td style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {log.meta ? (typeof log.meta === "string" ? log.meta : JSON.stringify(log.meta)) : "-"}
                      </td>
                  <td>{log.ipAddress || "-"}</td>
                  <td style={{ maxWidth: 120, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{log.userAgent || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
