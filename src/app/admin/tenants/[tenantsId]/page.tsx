import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TENANT_PLAN_LABEL, TENANT_MODE_LABEL } from "@/lib/tenantPlanUi";
import { resolveTenantWithCapabilities } from "@/lib/tenants/tenant-resolver";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { tenantsId: string };

function normalizeDomain(input: string) {
  const raw = (input || "").trim().toLowerCase();
  if (!raw) return "";
  const noProto = raw.replace(/^https?:\/\//, "");
  const noPath = noProto.split("/")[0] ?? noProto;
  const noPort = noPath.split(":")[0] ?? noPath;
  return noPort.startsWith("www.") ? noPort.slice(4) : noPort;
}

export default async function TenantDetailPage(props: { params: Promise<Params> }) {
  const session = await getServerSession(auth);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/login");
  }

  // ✅ params-key matches folder name: [tenantsId]
  const { tenantsId } = await props.params;
  const tenantId = String(tenantsId || "").trim();
  if (!tenantId) redirect("/admin/tenants");

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { domains: { orderBy: { createdAt: "desc" } } },
  });

  if (!tenant) {
    return (
      <main className="p-8">
        <div className="neumorph-card p-6 max-w-md text-center">
          <h1 className="text-xl font-bold">Tenant nicht gefunden</h1>
          <Link href="/admin/tenants" className="neobtn mt-4 inline-block">
            Zurück
          </Link>
        </div>
      </main>
    );
  }

  const primary = tenant.domains.find((d) => d.isPrimary)?.domain || "";

  const planLabel =
    TENANT_PLAN_LABEL[(tenant.plan || "FREE") as keyof typeof TENANT_PLAN_LABEL] ??
    String(tenant.plan || "FREE");

  const modeKey = String(tenant.mode || "WHITE_LABEL") as keyof typeof TENANT_MODE_LABEL;
  const modeLabel = TENANT_MODE_LABEL[modeKey] ?? String(tenant.mode || "WHITE_LABEL");

  // derive capabilities via resolver (single source of truth)
  let capabilities = null as any;
  try {
    const resolved = await resolveTenantWithCapabilities(tenant.key);
    capabilities = resolved.capabilities;
  } catch (err) {
    capabilities = null;
  }

  return (
    <div className="admin-shell">
      <div className="admin-breadcrumb">
        <span>Admin</span>
        <span className="admin-breadcrumb-dot" />
        <Link href="/admin/tenants">Tenants (White-Label)</Link>
        <span className="admin-breadcrumb-dot" />
        <span>{tenant.name}</span>
      </div>

      <header className="admin-header">
        <div className="admin-kicker">DigiEmu · Admin</div>
        <h1 className="admin-title">Tenant: {tenant.name}</h1>
        <p className="admin-subtitle">
          Key: <span className="font-mono">{tenant.key}</span> · Primary Domain:{" "}
          <span className="font-mono">{primary || "—"}</span>
        </p>
      </header>

      {/* Summary */}
      <section className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="neumorph-card p-5">
          <div className="text-xs text-[var(--text-muted)] mb-1">Key</div>
          <div className="font-mono">{tenant.key}</div>
        </div>

        <div className="neumorph-card p-5">
          <div className="text-xs text-[var(--text-muted)] mb-1">Status</div>
          <div className="font-semibold">{tenant.status}</div>
        </div>

        <div className="neumorph-card p-5">
          <div className="text-xs text-[var(--text-muted)] mb-1">Tenant-Plan (White-Label)</div>
          <div className="font-semibold">{planLabel}</div>

          <div className="mt-3 text-xs text-[var(--text-muted)] mb-1">Betriebsmodus</div>
          <div className="font-semibold">{modeLabel}</div>
        </div>

        {/* Capabilities (read-only, from resolver) */}
        <div className="neumorph-card p-5">
          <div className="text-xs text-[var(--text-muted)] mb-1">Capabilities (V1)</div>
          {capabilities ? (
            <ul className="text-sm space-y-1">
              <li>
                <strong>whiteLabelStore:</strong> {capabilities.whiteLabelStore ? "yes" : "no"}
              </li>
              <li>
                <strong>customDomain:</strong> {capabilities.customDomain ? "yes" : "no"}
              </li>
              <li>
                <strong>analytics:</strong> {capabilities.analytics ? "yes" : "no"}
              </li>
              <li>
                <strong>marketplaceBuy:</strong> {capabilities.marketplaceBuy ? "yes" : "no"}
              </li>
              <li>
                <strong>publicProducts:</strong> {capabilities.publicProducts ? "yes" : "no"}
              </li>
              <li>
                <strong>branding:</strong> {capabilities.branding ? "yes" : "no"}
              </li>
            </ul>
          ) : (
            <div className="text-sm text-[var(--text-muted)]">Capabilities unavailable</div>
          )}
        </div>
      </section>

      {/* Edit Tenant */}
      <section className="neumorph-card p-6 mb-6 max-w-3xl">
        <h2 className="text-lg font-semibold mb-4">Tenant bearbeiten</h2>

        <form action="/api/admin/tenants/update" method="POST" className="space-y-4">
          <input type="hidden" name="tenantId" value={tenant.id} />

          <div>
            <label className="block text-sm mb-1">Name</label>
            <input name="name" defaultValue={tenant.name} className="input-neu w-full" />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select name="status" defaultValue={tenant.status} className="input-neu w-full">
                <option value="ACTIVE">ACTIVE</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Tenant-Plan (White-Label)</label>
              <select name="plan" defaultValue={tenant.plan || "FREE"} className="input-neu w-full">
                <option value="FREE">{TENANT_PLAN_LABEL.FREE}</option>
                <option value="PRO">{TENANT_PLAN_LABEL.PRO}</option>
                <option value="ENTERPRISE">{TENANT_PLAN_LABEL.ENTERPRISE}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Betriebsmodus</label>
            <select
              name="mode"
              defaultValue={String(tenant.mode || "WHITE_LABEL")}
              className="input-neu w-full"
            >
              <option value="WHITE_LABEL">{TENANT_MODE_LABEL.WHITE_LABEL}</option>
              <option value="MARKETPLACE">{TENANT_MODE_LABEL.MARKETPLACE}</option>
            </select>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              White-Label = eigener Shop (Tenant). Marketplace = Multi-Vendor Modus (80/20).
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Logo URL (optional)</label>
            <input name="logoUrl" defaultValue={tenant.logoUrl ?? ""} className="input-neu w-full" />
          </div>

          {capabilities?.branding ? (
            <div>
              <label className="block text-sm mb-1">themeJson (optional)</label>
              <textarea
                name="themeJson"
                defaultValue={tenant.themeJson ? JSON.stringify(tenant.themeJson, null, 2) : ""}
                className="input-neu w-full min-h-[140px] font-mono text-xs"
                placeholder='{"accent":"#..."}'
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                JSON – leer lassen, wenn du es nicht nutzt.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--neo-card-border)] p-3 text-sm text-[var(--text-muted)]">
              Branding (Theme) ist für diesen Plan deaktiviert. Upgrade auf <strong>PRO</strong> oder <strong>ENTERPRISE</strong>.
            </div>
          )}

          <button className="neobtn primary" type="submit">
            Speichern
          </button>
        </form>
      </section>

      {/* Domains */}
      {capabilities?.customDomain ? (
        <section className="neumorph-card p-6 max-w-3xl">
          <h2 className="text-lg font-semibold mb-4">Domains</h2>

          <form action="/api/admin/tenants/domain/add" method="POST" className="flex flex-wrap gap-2 mb-4">
            <input type="hidden" name="tenantId" value={tenant.id} />
            <input
              name="domain"
              placeholder="z.B. blue-lotos.ch"
              className="input-neu flex-1 min-w-[220px]"
              required
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="makePrimary" value="1" />
              Primary
            </label>
            <button className="neobtn-sm" type="submit">
              Domain hinzufügen
            </button>
          </form>

          {tenant.domains.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Noch keine Domains.</p>
          ) : (
            <div className="space-y-2">
              {tenant.domains.map((d) => {
                const normalized = normalizeDomain(d.domain);
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-white/30 dark:bg-slate-900/40 border border-[var(--neo-card-border)]"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm truncate">{normalized}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {d.isPrimary ? "Primary" : "Secondary"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!d.isPrimary && (
                        <form action="/api/admin/tenants/domain/set-primary" method="POST">
                          <input type="hidden" name="tenantId" value={tenant.id} />
                          <input type="hidden" name="domainId" value={d.id} />
                          <button className="neobtn-sm ghost" type="submit">
                            Primary setzen
                          </button>
                        </form>
                      )}

                      <form action="/api/admin/tenants/domain/remove" method="POST">
                        <input type="hidden" name="tenantId" value={tenant.id} />
                        <input type="hidden" name="domainId" value={d.id} />
                        <button className="neobtn-sm ghost" type="submit">
                          Entfernen
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <Link href="/admin/tenants" className="neobtn-sm ghost">
              ← Zurück zur Liste
            </Link>
          </div>
        </section>
      ) : (
        <section className="neumorph-card p-6 max-w-3xl">
          <h2 className="text-lg font-semibold mb-4">Domains</h2>
          <div className="text-sm text-[var(--text-muted)]">
            This tenant does not have the <strong>customDomain</strong> capability.
            To enable custom domains, upgrade the plan or adjust the tenant configuration.
          </div>
          <div className="mt-4">
            <Link href="/admin/tenants" className="neobtn-sm ghost">
              ← Zurück zur Liste
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
