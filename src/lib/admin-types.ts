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

export default {};
