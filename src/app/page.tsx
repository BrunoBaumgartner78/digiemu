// src/app/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentTenant } from "@/lib/tenant-context";
import { resolveTenantHomePath } from "@/lib/tenants/home";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MainFooter from "@/components/layout/MainFooter";

export const dynamic = "force-dynamic";

type Metrics = {
  users: number | null;
  orders: number | null;
  gmvCHF: number | null; // amountCents
  platformCHF: number | null; // platformEarningsCents
  vendorCHF: number | null; // vendorEarningsCents
  activeProducts: number | null;
};

function formatNumber(n: number | null) {
  if (n === null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("de-CH").format(n);
}

function formatCHF(n: number | null) {
  if (n === null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
  }).format(n);
}

async function getPublicMetrics(): Promise<Metrics> {
  try {
    const usersPromise = prisma.user.count().catch(() => null);
    const ordersPromise = prisma.order.count().catch(() => null);

    const revenuePromise = (async () => {
      try {
        const agg = await prisma.order.aggregate({
          _sum: {
            amountCents: true,
            platformEarningsCents: true,
            vendorEarningsCents: true,
          },
        });

        const amountCents = agg?._sum?.amountCents;
        const platformCents = agg?._sum?.platformEarningsCents;
        const vendorCents = agg?._sum?.vendorEarningsCents;

        return {
          gmvCHF: typeof amountCents === "number" ? amountCents / 100 : null,
          platformCHF: typeof platformCents === "number" ? platformCents / 100 : null,
          vendorCHF: typeof vendorCents === "number" ? vendorCents / 100 : null,
        };
      } catch (e) {
        console.error("[home metrics] order.aggregate failed:", e);
        return { gmvCHF: null, platformCHF: null, vendorCHF: null };
      }
    })();

    const activeProductsPromise = (async () => {
      try {
        return await prisma.product.count({ where: { isActive: true, status: "ACTIVE" } });
      } catch {
        try {
          return await prisma.product.count();
        } catch {
          return null;
        }
      }
    })();

    const [users, orders, revenue, activeProducts] = await Promise.all([
      usersPromise,
      ordersPromise,
      revenuePromise,
      activeProductsPromise,
    ]);

    return {
      users,
      orders,
      gmvCHF: revenue.gmvCHF,
      platformCHF: revenue.platformCHF,
      vendorCHF: revenue.vendorCHF,
      activeProducts,
    };
  } catch (e) {
    console.error("[home metrics] failed:", e);
    return {
      users: null,
      orders: null,
      gmvCHF: null,
      platformCHF: null,
      vendorCHF: null,
      activeProducts: null,
    };
  }
}

function SectionTitle({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {kicker ? (
        <div style={{ fontSize: 12, opacity: 0.75, letterSpacing: 0.6, textTransform: "uppercase" }}>
          {kicker}
        </div>
      ) : null}
      <h2 style={{ marginTop: 6, marginBottom: 0, fontSize: 24, fontWeight: 900 }}>{title}</h2>
    </div>
  );
}

export default async function HomePage() {
  // Tenant-aware home routing: allow white-label tenants to default to /shop
  try {
    const tenant = await currentTenant();
    const { homePath } = await resolveTenantHomePath(tenant.key);
    if (homePath && homePath !== "/") redirect(homePath);
  } catch (e) {
    // Non-fatal: if tenant resolution fails, fall back to rendering the home page
    console.warn("tenant home routing failed:", e);
  }

  const session = await getServerSession(auth);
  const isLoggedIn = !!(session?.user as any)?.id;
  const role = ((session?.user as any)?.role as string | undefined) ?? undefined;

  const metrics = await getPublicMetrics();

  const primaryCTA = isLoggedIn ? "/marketplace" : "/register";
  const secondaryCTA = isLoggedIn ? "/dashboard" : "/login";

  const primaryLabel = isLoggedIn ? "Content OS öffnen" : "Konto erstellen";
  const secondaryLabel = isLoggedIn ? "Zum Dashboard" : "Login";

  return (
    <main className="page-shell" style={{ paddingTop: 10 }}>
      {/* HERO */}
      <section className="neo-card" style={{ padding: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              opacity: 0.85,
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            DigiEmu · Content OS + White-Label
          </span>

          {isLoggedIn ? (
            <span style={{ fontSize: 12, opacity: 0.7 }}>Eingeloggt{role ? ` · ${role}` : ""}</span>
          ) : (
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              Kaufen & verkaufen – oder deine eigene Plattform starten
            </span>
          )}
        </div>

        <h1 style={{ marginTop: 14, marginBottom: 10, fontSize: 40, fontWeight: 950, lineHeight: 1.05 }}>
          Digitale Produkte verkaufen.
          <br />
          Oder deinen eigenen Shop betreiben.
        </h1>

        <p style={{ marginTop: 0, opacity: 0.82, fontSize: 16, lineHeight: 1.6, maxWidth: 920 }}>
          DigiEmu hat zwei klare Modi:
          <strong> Content OS</strong> (80/20 – ohne Fixkosten) und{" "}
          <strong>Tenants / White-Label</strong> (Miete – 0% Provision, 100% Einnahmen beim Kunden).
          Wir halten das Modell bewusst einfach, damit es ruhig und stabil funktioniert.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Link href={primaryCTA} className="neobtn">
            {primaryLabel}
          </Link>
          <Link href={secondaryCTA} className="neobtn neobtn-ghost">
            {secondaryLabel}
          </Link>

          <Link href="/pricing" className="neobtn neobtn-ghost">
            So funktioniert’s & Preise
          </Link>
          <Link href="/help" className="neobtn neobtn-ghost">
            Hilfe
          </Link>
        </div>
      </section>

      {/* METRICS */}
      <section
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        <div className="neo-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>GMV (Umsatz gesamt)</div>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950 }}>{formatCHF(metrics.gmvCHF)}</div>
        </div>

        <div className="neo-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Plattform Einnahmen</div>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950 }}>{formatCHF(metrics.platformCHF)}</div>
        </div>

        <div className="neo-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Vendor Einnahmen</div>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950 }}>{formatCHF(metrics.vendorCHF)}</div>
        </div>

        <div className="neo-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Aktivität</div>
          <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.7 }}>
            <div>
              <strong>{formatNumber(metrics.users)}</strong> User
            </div>
            <div>
              <strong>{formatNumber(metrics.orders)}</strong> Bestellungen
            </div>
            <div>
              <strong>{formatNumber(metrics.activeProducts)}</strong> aktive Produkte
            </div>
          </div>
        </div>
      </section>

      {/* TWO MODES */}
      <section
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 14,
        }}
      >
        <div className="neo-card" style={{ padding: 22 }}>
          <SectionTitle kicker="Modus 1" title="Content OS (80/20 – keine Fixkosten)" />
          <p style={{ opacity: 0.85, lineHeight: 1.75, marginTop: 0 }}>
            Verkäufer zahlen <strong>0 CHF/Monat</strong>. Pro Verkauf gehen <strong>80%</strong> an den Vendor,
            <strong> 20%</strong> finanzieren Betrieb, Zahlungsabwicklung, Infrastruktur und Weiterentwicklung.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.88, lineHeight: 1.85 }}>
            <li>Produkt hochladen, Preis setzen, live schalten</li>
            <li>Checkout & Download-Flow inklusive</li>
            <li>Transparente Auswertungen im Dashboard</li>
          </ul>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link href="/marketplace" className="neobtn">
              Content OS ansehen
            </Link>
            <Link href="/become-seller" className="neobtn neobtn-ghost">
              Verkäufer werden
            </Link>
          </div>
        </div>

        <div className="neo-card" style={{ padding: 22 }}>
          <SectionTitle kicker="Modus 2" title="Tenants / White-Label (Miete – 0% Provision)" />
          <p style={{ opacity: 0.85, lineHeight: 1.75, marginTop: 0 }}>
            Für Communities, Organisationen und Publisher: eigener Shop / eigene Plattform mit Branding.
            Du zahlst eine <strong>fixe Monatsmiete</strong> – und behältst <strong>100%</strong> der Einnahmen.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.88, lineHeight: 1.85 }}>
            <li>Eigene Domain oder Subdomain</li>
            <li>Eigene Admin-Rolle, eigene Verkäufer</li>
            <li>Rechnung per E-Mail (10 Tage), Zahlung aufs Postkonto</li>
          </ul>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link href="/pricing#tenants" className="neobtn">
              Tenant-Preise ansehen
            </Link>
            <Link href="/help" className="neobtn neobtn-ghost">
              Fragen klären
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="neo-card" style={{ padding: 22, marginTop: 16 }}>
        <SectionTitle kicker="Über DigiEmu" title="Ein System, das bewusst ruhig bleibt" />
        <p style={{ opacity: 0.85, lineHeight: 1.75, marginTop: 0, maxWidth: 980 }}>
          Viele verkaufen digitale Produkte über zusammengesetzte Tools: Payment hier, Datei dort, Support dazwischen.
          DigiEmu bündelt die wichtigsten Bausteine in einem klaren Setup – damit Käufer weniger Reibung haben und
          Verkäufer schnell starten können.
        </p>
        <p style={{ opacity: 0.85, lineHeight: 1.75, marginTop: 10, maxWidth: 980 }}>
          Unser Fokus ist Klarheit in der Abrechnung: Content OS mit 80/20 – und White-Label/Tenants mit Miete (0%
          Provision). Keine versteckten Stufen, keine unnötigen Billing-Komplexitäten.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        <div className="neo-card" style={{ padding: 20 }}>
          <SectionTitle kicker="1" title="Entdecken & auswählen" />
          <p style={{ opacity: 0.85, lineHeight: 1.7, marginTop: 0 }}>
            Im Content OS findest du digitale Produkte mit klarer Preisangabe und sauberer Produktseite.
          </p>
        </div>

        <div className="neo-card" style={{ padding: 20 }}>
          <SectionTitle kicker="2" title="Sicher bezahlen" />
          <p style={{ opacity: 0.85, lineHeight: 1.7, marginTop: 0 }}>
            Der Checkout ist stabil und nachvollziehbar. Bestellungen werden sauber erfasst.
          </p>
        </div>

        <div className="neo-card" style={{ padding: 20 }}>
          <SectionTitle kicker="3" title="Sofort downloaden" />
          <p style={{ opacity: 0.85, lineHeight: 1.7, marginTop: 0 }}>
            Direkt nach dem Kauf sind Downloads verfügbar – ohne E-Mail-Chaos.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="neo-card" style={{ padding: 22, marginTop: 16, marginBottom: 18 }}>
        <SectionTitle kicker="FAQ" title="Häufige Fragen" />

        <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>Gibt es Vendor-Abos?</div>
            <div style={{ opacity: 0.85, lineHeight: 1.7, marginTop: 4 }}>
              Nein. Im Content OS gibt es keine Fixkosten. Die Abrechnung erfolgt über die 80/20-Aufteilung pro Verkauf.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 900 }}>Was ist der Unterschied zwischen Content OS und Tenant?</div>
            <div style={{ opacity: 0.85, lineHeight: 1.7, marginTop: 4 }}>
              Content OS: 80/20 pro Verkauf. Tenant/White-Label: fixe Monatsmiete, 0% Provision – der Kunde behält 100%.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 900 }}>Wie bezahlen Tenants?</div>
            <div style={{ opacity: 0.85, lineHeight: 1.7, marginTop: 4 }}>
              Per Rechnung (PDF per E-Mail), zahlbar innert 10 Tagen, Zahlung auf PostFinance-IBAN. Optional später per
              Stripe-Zahlungslink.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <Link href="/pricing" className="neobtn neobtn-ghost">
            So funktioniert’s & Preise
          </Link>
          <Link href="/marketplace" className="neobtn">
            Jetzt starten
          </Link>
        </div>
      </section>

      <MainFooter />
    </main>
  );
}
