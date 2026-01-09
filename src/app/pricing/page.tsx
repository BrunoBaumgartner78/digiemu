// src/app/pricing/page.tsx
import type { Metadata } from "next";
import * as React from "react";
import Link from "next/link";
import { TENANT_PLAN_LABEL, TENANT_PLAN_HINT } from "@/lib/tenantPlanUi";
import styles from "./page.module.css";

const ModeBadge = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: 0.2,
      border: "1px solid rgba(0,0,0,0.08)",
      background: "rgba(255,255,255,0.70)",
      boxShadow: "6px 6px 16px rgba(0,0,0,0.10), -6px -6px 16px rgba(255,255,255,0.90)",
    }}
  >
    {children}
  </span>
);

export const metadata: Metadata = {
  title: "So funktioniert DigiEmu – Content OS & White-Label",
  description:
    "DigiEmu hat zwei Modi: Content OS (80/20, keine Fixkosten) und Tenants/White-Label (Miete, 0% Provision, 100% Einnahmen beim Kunden).",
};

export default function PricingPage() {
  const year = new Date().getFullYear();

  return (
    <main className={styles.page}>
      <section className={styles.inner}>
        {/* Header */}
        <header className={styles.header}>
          <p className={styles.eyebrow}>So funktioniert DigiEmu</p>
          <div className="neo-card" style={{ padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.6 }}>
              <strong>Wichtig:</strong> <span style={{ opacity: 0.9 }}>“Tenant-Plan”</span> gilt nur für
              <strong> White-Label/Tenants</strong> (eigener Shop mit Branding).
              Der <strong>Content OS</strong> ist ein separater Modus (80/20) und hat keinen Tenant-Plan.
            </div>
          </div>

          <h1 className={styles.title}>Zwei klare Modelle. Keine Billing-Komplexität.</h1>
          <p className={styles.lead}>
            DigiEmu ist bewusst einfach: <strong>Content OS</strong> für digitale Produkte (80/20) – oder{" "}
            <strong>Tenants / White-Label</strong> für Communities und Organisationen (Miete, 0% Provision).
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link href="/marketplace" className="neobtn">
              Content OS öffnen
            </Link>
            <Link href="#tenants" className="neobtn neobtn-ghost">
              Tenant-Modelle
            </Link>
          </div>
        </header>

        {/* Content OS (80/20) */}
        <section className={styles.cardSection}>
          <article className={styles.planCard}>
            <div className={styles.planHeader}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                <ModeBadge>Modus: Content OS</ModeBadge>
                <ModeBadge>Split: 80/20</ModeBadge>
                <ModeBadge>0 CHF/Monat</ModeBadge>
              </div>

              <p className={styles.planBadge}>Content OS · 0 CHF / Monat · 20% Plattformanteil</p>
              <h2 className={styles.planTitle}>80% für Vendoren, 20% für Betrieb & Infrastruktur</h2>
              <p className={styles.planIntro}>
                Verkäufer:innen zahlen keine Fixkosten. Pro Verkauf behältst du <strong>80%</strong>.{" "}
                <strong>20%</strong> finanzieren Zahlungsabwicklung, Download-Infrastruktur, Sicherheit und Weiterentwicklung.
              </p>
            </div>

            <div className={styles.planGrid}>
              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Keine Fixkosten</h3>
                <p className={styles.blockText}>Kein Setup, kein Monatsabo. Du zahlst nur, wenn du verkaufst.</p>
              </div>

              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Faire Aufteilung</h3>
                <p className={styles.blockText}>
                  80% gehen an dich als Verkäufer:in. 20% decken Betrieb, Infrastruktur und Produktpflege.
                </p>
              </div>

              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Checkout & Download</h3>
                <p className={styles.blockText}>
                  DigiEmu liefert Checkout, Download-Link, Bestelllog und ein Dashboard – ohne Zusatztools.
                </p>
              </div>

              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Transparenz</h3>
                <p className={styles.blockText}>
                  Bestellungen, Einnahmen und Downloads sind nachvollziehbar im Account/Dashboard sichtbar.
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* Tenants / White-Label */}
        <section id="tenants" className={styles.cardSection}>
          <article className={styles.planCard}>
            <div className={styles.planHeader}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                <ModeBadge>Modus: White-Label</ModeBadge>
                <ModeBadge>Provision: 0%</ModeBadge>
                <ModeBadge>100% beim Kunden</ModeBadge>
              </div>

              <p className={styles.planBadge}>Tenants / White-Label · Miete · 0% Provision</p>
              <h2 className={styles.planTitle}>Du zahlst Miete – und behältst 100% deiner Einnahmen</h2>
              <p className={styles.planIntro}>
                Für Communities, Organisationen und Publisher: eigener Shop / eigene Plattform mit Branding.
                <strong> 0% Provision</strong> – keine Split-Payments. Abrechnung bewusst einfach per Rechnung.
              </p>
            </div>

            {/* Simple 3-tier grid without introducing new CSS classes */}
              <div className={styles.planGrid}>
              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Community</h3>
                <p className={styles.blockText}>
                  Für kleine Communities & Initiativen.
                  <br />
                  <strong>199 CHF / Monat</strong>
                  <br />
                  0% Provision · 100% Einnahmen beim Tenant
                </p>
              </div>

              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>{TENANT_PLAN_LABEL.PRO}</h3>
                <p className={styles.blockText}>{TENANT_PLAN_HINT.PRO}</p>
              </div>

              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>{TENANT_PLAN_LABEL.ENTERPRISE}</h3>
                <p className={styles.blockText}>{TENANT_PLAN_HINT.ENTERPRISE}</p>
              </div>

              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Abrechnung</h3>
                <p className={styles.blockText}>
                  Rechnung als PDF per E-Mail.
                  <br />
                  <strong>Zahlbar innert 10 Tagen</strong>.
                  <br />
                  Zahlung auf PostFinance-IBAN (optional später Stripe-Zahlungslink).
                </p>
              </div>

              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Stripe für Tenants?</h3>
                <p className={styles.blockText}>
                  <strong>Standard: nein.</strong> Der Tenant muss kein Stripe einrichten.
                  <br />
                  Optional später „Bring your own Stripe“ für größere Kunden.
                </p>
              </div>

              <div className={styles.planBlock}>
                <h3 className={styles.blockTitle}>Was du bekommst</h3>
                <p className={styles.blockText}>
                  Eigene Plattform, eigene Admin-Rolle, Verkäufer, Produkte, Checkout/Downloads, Logs & Dashboard.
                  Fokus: ruhig, wartbar, klar.
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* Self-selection (reduces sales) */}
        <section className={styles.noteSection}>
          <p className={styles.noteText}>
            <strong>Für wen ist DigiEmu?</strong> Für Teams/Personen, die eine ruhige, klare Plattform wollen – ohne
            Tool-Chaos. <strong>Nicht</strong> für „Bitte billig testen“ oder lange Sales-Prozesse. Wenn du das Modell
            hier verstehst und es passt, passt auch die Zusammenarbeit.
          </p>
        </section>

        {/* Beta note */}
        <section className={styles.noteSection}>
          <p className={styles.noteText}>
            Hinweis: DigiEmu ist im Aufbau. Konditionen können sich während der Beta-Phase anpassen.
            Größere Änderungen kommunizieren wir frühzeitig.
          </p>
        </section>

        <footer className={styles.footer}>© {year} DigiEmu – Content OS & White-Label</footer>
      </section>
    </main>
  );
}
