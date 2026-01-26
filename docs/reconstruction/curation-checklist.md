# Curation Rekonstruktion – Checklist

Ziel: Jede Seite nutzt dieselben Regeln (Single Source of Truth).

## Public
- [ ] Shop Listing (nur approved Produkte von approved Vendors)
- [ ] Product Detail Page (404 wenn nicht public)
- [ ] Vendor Public Page (nur approved Vendors + deren public Produkte)

## Vendor
- [ ] Vendor Dashboard: eigene Produkte (auch pending/unapproved)
- [ ] Product Edit Page: nur owner + vendor role
- [ ] Upload Flow: default pending/unapproved

## Admin
- [ ] Admin Vendors Liste (pending/rejected/approved)
- [ ] Admin Products Liste (pending/rejected/approved)
- [ ] Approve/Reject Buttons (API routes oben)
- [ ] AuditLog Einträge

## Cross-cutting
- [ ] Blocked User/Product: überall verstecken (policy toggle)
- [ ] CSV Exports respektieren Policy
- [ ] Caching/ISR: public only, admin always dynamic
