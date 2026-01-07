    **Stand:** Januar 2026  
    **Domain (aktuell):** bellu.ch  
    **Default Tenant:** `bellu` (via `DEFAULT_TENANT_KEY` oder tenants.yml)

    Diese Dokumentation beschreibt, wie DigiEmu als Plattform in **3 Betriebsmodi** betrieben werden kann:

    1. **Multivendor Marketplace** (Standard: mehrere Vendoren, Marketplace sichtbar)
    2. **Vendor-Shop** (ein Vendor / kuratierter Vendor-Store, Marketplace eingeschränkt)
    3. **Free-Shop** (nur kostenlose Produkte, Payments deaktiviert)

    Zusätzlich: Hinweise zur **Tenant-/White-Label-Architektur** und zu **Safe-Migrations** (tenantKey).

    ---

    ## Grundlagen: Tenant Scoping (White-Label)

    DigiEmu kann pro Domain/Host einen Tenant laden.  
    Der Tenant steuert **Branding** und **Feature-Flags**:

    - Vendor Onboarding (z.B. Admin Approval)
    - Catalog Mode (free/paid/mixed)
    - Payments (on/off)
    - Visibility (public/members)
    - Features (Marketplace UI, Bundles, etc.)

    **Codepattern (Server-side):**

    - Tenant aus Host ermitteln (z.B. `headers()` / `currentTenant()`).
    - Alle DB-Queries, die Marketplace-Daten betreffen, tenant-scopen:
      - `VendorProfile.tenantKey`
      - `Product.tenantKey`
      - `Order.tenantKey`

    ---

    ## tenants.yml – Beispiel

    Datei: `config/tenants.yml`

    ```yml
    version: 1
    tenants:
      bellu:
        name: "Bellu"
        domains: ["bellu.ch", "www.bellu.ch", "localhost"]
        vendorOnboarding: "OPEN_WITH_APPROVAL"   # oder ADMIN_ONLY / DB_ONLY
        catalogMode: "MIXED"                     # FREE_ONLY / PAID_ONLY / MIXED
        payments: "ON"                           # ON / OFF
        visibility: "PUBLIC"                     # PUBLIC / MEMBERS_ONLY
        branding:
          logoUrl: "/logo.svg"
          primaryColor: "#8FB2FF"
          accentColor: "#2E6BFF"
        legal:
          imprintUrl: "/impressum"
          privacyUrl: "/datenschutz"
        features:
          showMarketplaceUI: true
          allowBundles: true
    ```

    > **Wichtig:** `domains` muss die echte Domain enthalten. Für lokale Dev reicht `localhost`.

    ---

    # Mode 1: Multivendor Marketplace (Standard)

    **Ziel:** Mehrere Vendoren verkaufen im Marketplace.  
    **Typische Use Cases:** Plattform, Marktplatz, Community Marketplace.

    ### Konfiguration
    - `vendorOnboarding: OPEN_WITH_APPROVAL`
    - `catalogMode: MIXED`
    - `payments: ON`
    - `features.showMarketplaceUI: true`

    ### Verhalten
    - Vendor registriert → `VendorProfile.status = PENDING`
    - Admin schaltet frei → `APPROVED`
    - Vendor kann Produkte erstellen (tenant-scoped)
    - Marketplace zeigt Produkte `status=ACTIVE` und `tenantKey=<current>`

    ### Checks
    - Admin: `/admin/users` zeigt VendorStatus
    - Approval API: muss tenant-scoped sein (`vendorProfileId` + `tenantKey`)

    ---

    # Mode 2: Vendor-Shop (Single Vendor / kuratiert)

    **Ziel:** Ein Shop wie eine “Brand-Storefront”, kein offener Marketplace.  
    **Typische Use Cases:** Ein Creator/Label, eine Akademie, ein Verein.

    ### Konfiguration (Option A: UI-only)
    - `features.showMarketplaceUI: false`
    - `vendorOnboarding: ADMIN_ONLY` oder `DB_ONLY`

    Ergebnis:
    - Marketplace-Navigation/Listen sind ausgeblendet.
    - Produkte existieren weiterhin (intern), nur Storefront zeigt sie.

    ### Konfiguration (Option B: enforced)
    - Zusätzlich serverseitig nur 1 Vendor zulassen:
      - beim Onboarding: blocken wenn bereits ein `APPROVED` VendorProfile existiert
      - oder per Admin manuell nur einen Vendor freischalten

    ### Implementationshinweis
    - Storefront kann auf “Featured Vendor” zeigen (z.B. aus config oder DB).
    - Queries bleiben tenant-scoped.

    ---

    # Mode 3: Free-Shop (nur kostenlose Produkte)

    **Ziel:** Alles ist gratis, kein Stripe nötig.  
    **Typische Use Cases:** Freebies, Open Library, Promo-Katalog.

    ### Konfiguration
    - `catalogMode: FREE_ONLY`
    - `payments: OFF`

    ### Server Enforcement
    - Beim Produkt erstellen:
      - wenn `catalogMode=FREE_ONLY` → `priceCents` muss 0 sein
    - Wenn `payments=OFF`:
      - Checkout-Routen blocken
      - UI: Kauflogik ausblenden, stattdessen “Download” / “Get for free”

    ### UI Anpassung (Empfehlung)
    - CTA: “Kostenlos herunterladen”
    - Kein Stripe Button / kein Checkout Link
    - Download ggf. direkt via signiertem Link / Order-less flow
      - (Optional: weiterhin Orders schreiben, aber `amountCents=0`)

    ---

    ## TenantKey: Safe Migration (Kurzüberblick)

    **Ziel:** Alle relevanten Tabellen sind tenant-scoped.

    Tabellen:
    - `VendorProfile.tenantKey`
    - `Product.tenantKey`
    - `Order.tenantKey`

    **Safe Phase 1**
    - tenantKey als **nullable** hinzufügen (`String?`)
    - Backfill-Script ausführen (setzt NULL → `b e l l u`/Default Tenant)
    - Preflight (NULL count, duplicate checks)

    **Phase 2**
    - tenantKey auf `String @default("bellu")` (oder "digiemu") setzen
    - Composite uniques hinzufügen:
      - `@@unique([tenantKey, userId])`
      - `@@unique([tenantKey, slug])` (wenn slug pro tenant eindeutig sein soll)
    - Optional: `@@index([tenantKey, status])`, `@@index([tenantKey, vendorId])`

    ---

    ## Troubleshooting

    ### VendorProfile relation: vendorProfile vs vendorProfiles
    Wenn dein Schema Multi-tenant VendorProfiles zulässt, ist die Relation in `User`:
    - `vendorProfiles VendorProfile[]`

    Dann muss im Admin-Users-Query auch `vendorProfiles` verwendet werden (nicht `vendorProfile`).

    ### headers() in Next.js 16
    In Turbopack/Next 16 kann `headers()` eine Promise sein.
    Lösung: in einer Utility wie `currentTenant()` kapseln und dort korrekt auflösen.

    ---

    ## Quick Checklist (Go-Live)

    - [ ] tenants.yml enthält Domain (bellu.ch) + localhost
    - [ ] Tenant loader lädt ohne DEFAULT_CONFIG warnings
    - [ ] tenantKey in DB ist überall gefüllt (kein NULL)
    - [ ] Vendor Approval API tenant-scoped
    - [ ] Product listing / marketplace queries tenant-scoped
    - [ ] Mode (1/2/3) in tenants.yml korrekt gesetzt

    ---

    **Ende.**