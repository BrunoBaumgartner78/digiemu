# Tenant Model (Kurznotiz)

- DigiEmu ist **Multi-Tenant (White-Label)** + **plattformweiter Marketplace**.
- Jeder Datensatz hat einen **tenantKey** (Default: `DEFAULT`).
- **White-Label Shop**: Seiten/Queries sind host-scoped → `tenantKey = currentTenant.key`.
- **Marketplace**: plattformweit, **nicht host-scoped** → `tenantKey = MARKETPLACE`.
- Seller-Profile sind **multi-tenant**: `VendorProfile.tenantKey` + `userId` ist eindeutig.
- Marketplace zeigt Produkte nur, wenn:
  - `Product.tenantKey = MARKETPLACE`
  - `Product.isActive = true` und `Product.status = "ACTIVE"`
  - `VendorProfile.tenantKey = MARKETPLACE`, `isPublic = true`, `status = APPROVED`
  - `User.isBlocked = false`
- Seller-Profilseiten zeigen Produkte nur aus **dem tenantKey des VendorProfiles**.
- Legacy-Fix: Backfill setzt fehlende `tenantKey`/`vendorProfileId` und kopiert Marketplace-Produkte in `MARKETPLACE`.
