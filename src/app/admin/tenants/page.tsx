import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TENANT_PLAN_LABEL, TENANT_MODE_LABEL } from "@/lib/tenantPlanUi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SearchParams = { [key: string]: string | string[] | undefined };

function pickFirst(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] ?? "" : v;
}

function normalizeDomain(input: string) {
  const raw = (input || "").trim().toLowerCase();
  if (!raw) return "";
  const noProto = raw.replace(/^https?:\/\//, "");
  const noPath = noProto.split("/")[0] ?? noProto;
  const noPort = noPath.split(":")[0] ?? noPath;
  return noPort.startsWith("www.") ? noPort.slice(4) : noPort;
}

function statusBadge(status: string) {
  const s = (status || "").toUpperCase();
  return s === "ACTIVE"
    ? "bg-emerald-500/10 text-emerald-400"
    : "bg-rose-500/10 text-rose-500";
}

function planBadge(plan: string) {
  const p = (plan || "").toUpperCase();
  if (p === "PRO") return "bg-indigo-500/10 text-indigo-300";
  if (p === "ENTERPRISE") return "bg-amber-500/10 text-amber-300";
  return "bg-slate-500/10 text-slate-400";
}

export default async function AdminTenantsPage(props: { searchParams?: Promise<SearchParams> }) {
  const session = await getServerSession(auth);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const sp = props.searchParams ? await props.searchParams : {};
  const q = pickFirst(sp.q).trim();
  const status = (pickFirst(sp.status) || "ALL").toUpperCase();
  const plan = (pickFirst(sp.plan) || "ALL").toUpperCase();
  const mode = (pickFirst(sp.mode) || "ALL").toUpperCase();

  // Basic filtering (in-memory for simplicity; can be moved to prisma where)
  const tenants = await prisma.tenant.findMany({
    include: { domains: true },
    orderBy: { createdAt: "desc" },
  });

  const filtered = tenants.filter((t) => {
    if (status !== "ALL" && t.status !== status) return false;
    if (plan !== "ALL" && t.plan !== plan) return false;
    if (mode !== "ALL" && String(t.mode || "").toUpperCase() !== mode) return false;
    if (q) {
      const primary = t.domains.find((d) => d.isPrimary)?.domain || "";
      const anyDomain = t.domains.map((d) => d.domain).join(" ");
      const hay = `${t.name} ${t.key} ${primary} ${anyDomain}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="admin-shell">
      <div className="admin-breadcrumb">
        <span>Admin</span>
        <span className="admin-breadcrumb-dot" />
        <span>Tenants (White-Label)</span>
      </div>

      <header className="admin-header">
        <div className="admin-kicker">DigiEmu · Admin</div>
        <h1 className="admin-title">Tenants (White-Label)</h1>
        <p className="admin-subtitle">
          Mandanten verwalten (Domains, Status, Plan für White-Label).
          <span className="ml-2 text-xs text-[var(--text-muted)]">
            Hinweis: Tenant-Plan betrifft nur White-Label (eigener Shop). Marketplace ist davon unabhängig (80/20).
          </span>
        </p>
      </header>

      {/* Filters */}
      <section className="neumorph-card p-6 mb-6">
        <form className="flex flex-wrap gap-3 items-center" method="get">
          <input
            name="q"
            defaultValue={q}
            placeholder="Suche: Name, Key, Domain…"
            className="input-neu w-full max-w-sm text-sm"
          />
          <select name="status" defaultValue={status} className="input-neu w-44 text-sm">
            <option value="ALL">Status: Alle</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>

          <div className="flex flex-wrap gap-2">
            <select name="plan" defaultValue={plan} className="input-neu w-44 text-sm">
              <option value="ALL">Plan: Alle</option>
              <option value="FREE">{TENANT_PLAN_LABEL.FREE}</option>
              <option value="PRO">{TENANT_PLAN_LABEL.PRO}</option>
              <option value="ENTERPRISE">{TENANT_PLAN_LABEL.ENTERPRISE}</option>
            </select>

            <select name="mode" defaultValue={mode} className="input-neu w-56 text-sm">
              <option value="ALL">Modus: Alle</option>
              <option value="WHITE_LABEL">{TENANT_MODE_LABEL.WHITE_LABEL}</option>
              <option value="MARKETPLACE">{TENANT_MODE_LABEL.MARKETPLACE}</option>
            </select>
          </div>

          <button className="neobtn-sm" type="submit">
            Filtern
          </button>

          <div className="flex-1" />

          <Link href="/admin/tenants/new" className="neobtn-sm primary">
            + Neuer White-Label Shop
          </Link>
        </form>
      </section>

      {/* Table */}
      <section className="neumorph-card p-6 overflow-x-auto">
        <div className="mb-3 text-xs text-[var(--text-muted)]">
          {filtered.length} Tenant(s)
        </div>

        <table className="min-w-[900px] text-sm admin-table">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">Key</th>
              <th className="py-2 px-3 text-left">Primary Domain</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-left">Plan (White-Label)</th>
              <th className="py-2 px-3 text-left">Modus</th>
              <th className="py-2 px-3 text-left">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[var(--text-muted)]">
                  Keine Tenants gefunden.
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const primary = t.domains.find((d) => d.isPrimary)?.domain || "";
                return (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 px-3 font-medium">{t.name}</td>
                    <td className="py-2 px-3">
                      <span className="font-mono text-xs px-2 py-1 rounded-full border border-[var(--neo-card-border)] bg-[var(--neo-card-bg-soft)]">
                        {t.key}
                      </span>
                    </td>
                    <td className="py-2 px-3">{primary || "—"}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${planBadge(t.plan)}`}>
                        {TENANT_PLAN_LABEL[(t.plan || "FREE") as keyof typeof TENANT_PLAN_LABEL]}
                      </span>
                    </td>

                    <td className="py-2 px-3 text-sm text-[var(--text-muted)]">
                      {TENANT_MODE_LABEL[(String(t.mode || "WHITE_LABEL") as keyof typeof TENANT_MODE_LABEL)] ?? String(t.mode || "WHITE_LABEL")}
                    </td>
                    <td className="py-2 px-3 flex flex-wrap gap-2">
                      <Link className="neobtn-sm" href={`/admin/tenants/${t.id}`}>
                        Öffnen
                      </Link>

                      <form action="/api/admin/tenants/update" method="POST">
                        <input type="hidden" name="tenantId" value={t.id} />
                        <input type="hidden" name="toggleStatus" value="1" />
                        <button className="neobtn-sm ghost" type="submit">
                          {t.status === "ACTIVE" ? "Block" : "Unblock"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
