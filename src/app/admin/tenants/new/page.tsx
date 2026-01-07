import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import TenantModeSelect from "@/components/tenants/TenantModeSelect";
import { TENANT_PLAN_LABEL, TENANT_PLAN_HELP } from "@/lib/tenantPlanUi";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TenantCreatePage() {
  const session = await getServerSession(auth);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  return (
    <div className="admin-shell">
      <div className="admin-breadcrumb">
        <span>Admin</span>
        <span className="admin-breadcrumb-dot" />
        <Link href="/admin/tenants">White-Label Shops</Link>
        <span className="admin-breadcrumb-dot" />
        <span>Neu</span>
      </div>

      <header className="admin-header">
        <div className="admin-kicker">DigiEmu · Admin</div>
        <h1 className="admin-title">Neuen White-Label Shop erstellen</h1>
        <p className="admin-subtitle">Neuen White-Label Shop anlegen + optional Primary Domain.</p>
      </header>

      <section className="neumorph-card p-6 max-w-2xl">
        <form action="/api/admin/tenants/create" method="POST" className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Key (slug)</label>
            <input
              name="key"
              placeholder="z.B. blue-lotos"
              className="input-neu w-full"
              required
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Nur a-z, 0-9 und Bindestrich. Wird später als tenantKey genutzt.
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              name="name"
              placeholder="z.B. Blue Lotos"
              className="input-neu w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Plan (nur White-Label)</label>
            <select name="plan" defaultValue="FREE" className="input-neu w-full">
              <option value="FREE">{TENANT_PLAN_LABEL.FREE}</option>
              <option value="PRO">{TENANT_PLAN_LABEL.PRO}</option>
              <option value="ENTERPRISE">{TENANT_PLAN_LABEL.ENTERPRISE}</option>
            </select>
            <div className="text-xs text-[var(--text-muted)] mt-2">{TENANT_PLAN_HELP}</div>
          </div>

          {/* ✅ mode belongs BEFORE buttons so it’s never missed */}
          <div>
            <TenantModeSelect />
          </div>

          <div>
            <label className="block text-sm mb-1">Primary Domain (optional)</label>
            <input
              name="primaryDomain"
              placeholder="z.B. blue-lotos.ch"
              className="input-neu w-full"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Optional. Wenn gesetzt, wird Domain normalisiert (www/port entfernt).
            </p>
          </div>

          <div className="flex gap-2">
            <button className="neobtn primary" type="submit">
              Speichern
            </button>
            <Link className="neobtn-sm ghost" href="/admin/tenants">
              Abbrechen
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
