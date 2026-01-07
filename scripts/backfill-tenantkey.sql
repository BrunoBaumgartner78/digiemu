-- Backfill for digiemu-only (safe default)
UPDATE "VendorProfile" SET "tenantKey" = 'digiemu' WHERE "tenantKey" IS NULL;
UPDATE "Product"       SET "tenantKey" = 'digiemu' WHERE "tenantKey" IS NULL;
UPDATE "Order"         SET "tenantKey" = 'digiemu' WHERE "tenantKey" IS NULL;
