import { Prisma } from "@prisma/client";

// Admin-focused payloads using Prisma GetPayload helpers
export type AdminAuditLogRow = Prisma.AuditLogGetPayload<{
  include: { actor: { select: { email: true; name: true } } };
}>;

export type AdminOrderRow = Prisma.OrderGetPayload<{
  include: {
    buyer: { select: { id: true; email: true } };
    product: {
      select: {
        id: true;
        title: true;
        vendor: { select: { id: true; email: true; vendorProfile: { select: { displayName: true } } } };
      };
    };
  };
}>;

export type AdminPayoutRow = Prisma.PayoutGetPayload<{
  include: { vendor: { select: { id: true; email: true; vendorProfile: { select: { displayName: true } } } } };
}>;

export type AdminProductEditModel = Prisma.ProductGetPayload<{
  include: { vendorProfile: { select: { id: true; displayName: true } } };
}>;

export type AdminUserRow = Prisma.UserGetPayload<{
  select: { id: true; email: true; name: true; isBlocked: true };
}>;

export type AdminVendorRow = Prisma.UserGetPayload<{
  include: { vendorProfile: { select: { id: true; displayName: true; isPublic: true } } };
}>;

export type AdminProductRow = Prisma.ProductGetPayload<{
  select: { id: true; title: true; status: true; vendorProfile: { select: { id: true; displayName: true } } };
}>;

export type JsonValue = Prisma.JsonValue;
