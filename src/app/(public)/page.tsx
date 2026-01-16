// src/app/(public)/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      } catch (_e) {
        console.error("[home metrics] order.aggregate failed:", _e);
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
  } catch (_e) {
    console.error("[home metrics] failed:", _e);
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
  const session = await getServerSession(auth);
  const isLoggedIn = !!(session?.user as any)?.id;
  const role = ((session?.user as any)?.role as string | undefined) ?? undefined;

  const metrics = await getPublicMetrics();

  const primaryCTA = isLoggedIn ? "/marketplace" : "/register";
  const secondaryCTA = isLoggedIn ? "/dashboard" : "/login";

  const primaryLabel = isLoggedIn ? "Marketplace öffnen" : "Konto erstellen";
  const secondaryLabel = isLoggedIn ? "Zum Dashboard" : "Login";

  return (
    <main className="page-shell" style={{ paddingTop: 10 }}>
      {/* HERO */}
      <section className="neo-card neonCard neonBorder glowSoft" style={{ padding: 26 }}>
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
            DigiEmu · Digital Marketplace
          </span>

          {isLoggedIn ? (
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              Eingeloggt{role ? ` · ${role}` : ""}
            </span>
          ) : (
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              Kaufen & verkaufen – ohne Umwege
            </span>
          )}
        </div>

        <h1 style={{ marginTop: 14, marginBottom: 10, fontSize: 40, fontWeight: 950, lineHeight: 1.05 }}>
          Digitale Produkte.
          <br />
          Sofort verfügbar.
        </h1>

        <p style={{ marginTop: 0, opacity: 0.82, fontSize: 16, lineHeight: 1.6, maxWidth: 860 }}>
          DigiEmu ist ein Marktplatz für digitale Downloads: Käufer finden hochwertige Dateien,
          Verkäufer veröffentlichen Produkte in Minuten – inklusive Checkout, Download-Link und
          klarer Abrechnung.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Link href={primaryCTA} className="neobtn">
            {primaryLabel}
          </Link>
          <Link href={secondaryCTA} className="neobtn neobtn-ghost">
            {secondaryLabel}
          </Link>

          <Link href="/pricing" className="neobtn neobtn-ghost">
            Preise
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
        <div className="neo-card neonCard glowHover" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Umsatz gesamt</div>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950 }}>
            {formatCHF(metrics.gmvCHF)}
          </div>
        </div>

        <div className="neo-card neonCard glowHover" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Plattform Einnahmen</div>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950 }}>
            {formatCHF(metrics.platformCHF)}
          </div>
        </div>

        <div className="neo-card neonCard glowHover" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Vendor Einnahmen</div>
          <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950 }}>
            {formatCHF(metrics.vendorCHF)}
          </div>
        </div>

        <div className="neo-card neonCard glowHover" style={{ padding: 18 }}>
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

      {/* ABOUT */}
      <section className="neo-card neonCard neonBorder glowSoft" style={{ padding: 22, marginTop: 16 }}>
        <SectionTitle kicker="Über DigiEmu" title="Ein Marktplatz, der sofort funktioniert" />
        <p style={{ opacity: 0.85, lineHeight: 1.75, marginTop: 0, maxWidth: 980 }}>
          DigiEmu verbindet Käufer und Verkäufer digitaler Produkte – ohne komplizierte Setups.
          Verkäufer laden Dateien hoch, definieren Preis und Beschreibung und können das Produkt
          veröffentlichen. Käufer bezahlen sicher, erhalten einen gültigen Download-Link und können
          ihre Käufe jederzeit im Account einsehen.
        </p>
        <p style={{ opacity: 0.85, lineHeight: 1.75, marginTop: 10, maxWidth: 980 }}>
          Der Fokus liegt auf Klarheit: transparente Preise, nachvollziehbare Downloads, klare Rollen
          (Buyer, Vendor, Admin) und ein sauberes Dashboard für Produkte, Einnahmen und Auszahlungen.
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
        <div className="neo-card neonCard glowHover" style={{ padding: 20 }}>
          <SectionTitle kicker="1" title="Entdecken & auswählen" />
          <p style={{ opacity: 0.85, lineHeight: 1.7, marginTop: 0 }}>
            Im Marketplace findest du digitale Produkte mit Vorschaubild, Beschreibung und klarer
            Preisangabe. Du kannst vergleichen, speichern und später kaufen.
          </p>
        </div>

        <div className="neo-card neonCard glowHover" style={{ padding: 20 }}>
          <SectionTitle kicker="2" title="Sicher bezahlen" />
          <p style={{ opacity: 0.85, lineHeight: 1.7, marginTop: 0 }}>
            Nach dem Checkout wird die Bestellung erfasst und du bekommst Zugriff auf deine Downloads.
            Der Prozess ist schnell, stabil und nachvollziehbar.
          </p>
        </div>

        <div className="neo-card neonCard glowHover" style={{ padding: 20 }}>
          <SectionTitle kicker="3" title="Sofort downloaden" />
          <p style={{ opacity: 0.85, lineHeight: 1.7, marginTop: 0 }}>
            Deine Dateien sind direkt verfügbar. Im Account kannst du Downloads erneut aufrufen,
            Bestellungen prüfen und deine Bibliothek verwalten.
          </p>
        </div>
      </section>

      {/* FOR BUYERS / VENDORS */}
      <section
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 14,
        }}
      >
        <div className="neo-card neonCard glowHover" style={{ padding: 22 }}>
          <SectionTitle kicker="Für Käufer" title="Einfach kaufen, sauber verwalten" />
          <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.88, lineHeight: 1.85 }}>
            <li>Übersichtliche Produktseiten mit klaren Informationen</li>
            <li>Bestellungen und Downloads im Account an einem Ort</li>
            <li>Direkter Zugriff nach dem Kauf – ohne E-Mail-Chaos</li>
          </ul>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link href="/marketplace" className="neobtn">
              Marketplace
            </Link>
            {isLoggedIn ? (
              <Link href="/account/downloads" className="neobtn neobtn-ghost">
                Meine Downloads
              </Link>
            ) : (
              <Link href="/login" className="neobtn neobtn-ghost">
                Login
              </Link>
            )}
          </div>
        </div>

        <div className="neo-card neonCard glowHover" style={{ padding: 22 }}>
          <SectionTitle kicker="Für Verkäufer" title="Veröffentlichen, verkaufen, auswerten" />
          <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.88, lineHeight: 1.85 }}>
            <li>Produkt erstellen, Datei hochladen, Preis setzen</li>
            <li>Dashboard für Produkte, Einnahmen und Auszahlungen</li>
            <li>Professioneller Kauf- & Download-Flow ohne Zusatztools</li>
          </ul>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link href="/become-seller" className="neobtn">
              Verkäufer werden
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard" className="neobtn neobtn-ghost">
                Dashboard
              </Link>
            ) : (
              <Link href="/register" className="neobtn neobtn-ghost">
                Konto erstellen
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ABOUT US */}
      <section className="neo-card neonCard neonBorder glowSoft" style={{ padding: 22, marginTop: 16 }}>
        <SectionTitle kicker="About us" title="Warum wir DigiEmu bauen" />
        <p style={{ opacity: 0.85, lineHeight: 1.75, marginTop: 0, maxWidth: 980 }}>
          Viele digitale Produkte werden heute über zusammengewürfelte Systeme verkauft: Payment hier,
          Datei dort, Support irgendwo dazwischen. DigiEmu bündelt die wichtigsten Bausteine in einem
          klaren, wartbaren Setup – damit Käufer weniger Reibung haben und Verkäufer schneller
          Umsätze erzielen.
        </p>
        <p style={{ opacity: 0.85, lineHeight: 1.75, marginTop: 10, maxWidth: 980 }}>
          Unser Anspruch ist ein Marktplatz, der nicht „laut&quot; sein muss, um zu funktionieren: saubere
          Performance, klare Navigation, und ein Design, das sich angenehm anfühlt.
        </p>
      </section>

      {/* FAQ */}
      <section className="neo-card neonCard neonBorder glowSoft" style={{ padding: 22, marginTop: 16, marginBottom: 18 }}>
        <SectionTitle kicker="FAQ" title="Häufige Fragen" />

        <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>Kann ich DigiEmu ohne Konto nutzen?</div>
            <div style={{ opacity: 0.85, lineHeight: 1.7, marginTop: 4 }}>
              Ja – der Marketplace und Informationsseiten sind öffentlich. Für Käufe, Downloads und
              das Dashboard brauchst du ein Konto.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 900 }}>Wie schnell erhalte ich meinen Download?</div>
            <div style={{ opacity: 0.85, lineHeight: 1.7, marginTop: 4 }}>
              Direkt nach dem Kauf. Im Account findest du deine Bestellungen und Downloads jederzeit
              wieder.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 900 }}>Kann ich als Verkäufer mehrere Produkte anbieten?</div>
            <div style={{ opacity: 0.85, lineHeight: 1.7, marginTop: 4 }}>
              Ja. Du verwaltest Produkte, Status und Performance im Dashboard und kannst Inhalte
              laufend erweitern.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <Link href="/help" className="neobtn neobtn-ghost">
            Hilfe öffnen
          </Link>
          <Link href="/pricing" className="neobtn neobtn-ghost">
            Preise ansehen
          </Link>
          <Link href="/marketplace" className="neobtn">
            Jetzt starten
          </Link>
        </div>
      </section>
    </main>
  );
}
