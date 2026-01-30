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

// List / page row variants used in admin pages
export type AdminUserListRow = Prisma.UserGetPayload<{
  include: { orders: { select: { id: true } }; products: { select: { id: true } } };
}>;

export type AdminVendorListRow = Prisma.UserGetPayload<{
  include: {
    vendorProfile: { select: { id: true; displayName: true; isPublic: true; status: true } };
    products: { include: { orders: { select: { vendorEarningsCents: true } } } };
  };
}>;

// Lightweight variant matching queries that only select product.id + orders.vendorEarningsCents
export type AdminVendorListRowLite = Prisma.UserGetPayload<{
  include: {
    vendorProfile: { select: { id: true; displayName: true; isPublic: true; status: true } };
    products: { select: { id: true; orders: { select: { vendorEarningsCents: true } } } };
    payouts?: true;
  };
}>;

export type AdminProductListRow = Prisma.ProductGetPayload<{
  include: {
    vendor: { select: { id: true; email: true; isBlocked: true } };
    vendorProfile: { select: { id: true; userId: true; status: true; isPublic: true } };
    _count: { select: { orders: true } };
  };
}>;

export type AdminDownloadRow = Prisma.DownloadLinkGetPayload<{
  include: { order: { select: { id: true; buyer: { select: { id: true; email: true } } } } };
}>;

export type AdminPayoutListRow = Prisma.PayoutGetPayload<{
  include: { vendor: { select: { id: true; email: true; vendorProfile: { select: { displayName: true } } } } };
}>;

// Detail payload for a single vendor used in the admin vendor detail page
export type AdminVendorDetail = Prisma.UserGetPayload<{
  include: {
    vendorProfile: true;
    products: {
      orderBy: { createdAt: "desc" };
      include: { orders: { select: { vendorEarningsCents: true; createdAt: true } } };
    };
    payouts: { orderBy: { createdAt: "desc" } };
  };
}>;

// Detail payload for a single product (if needed)
export type AdminProductDetail = Prisma.ProductGetPayload<{
  include: {
    vendor: { select: { id: true; email: true; isBlocked: true } };
    vendorProfile: { select: { id: true; userId: true; status: true; isPublic: true } };
    _count: { select: { orders: true } };
  };
}>;
