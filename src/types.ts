// Typen für Sales-Dashboard und Admin-Übersicht

export type VendorSale = {
  id: string;
  amountCents: number;
  createdAt: string;
  product: {
    id: string;
    title: string;
    category?: string;
    thumbnail?: string;
  };
  buyer?: {
    id: string;
    name?: string;
    email?: string;
  };
  downloadLink?: {
    id: string;
    fileUrl: string;
    expiresAt: string;
  };
};

export type OrderWithProduct = {
  id: string;
  amountCents: number;
  createdAt: string;
  product: {
    id: string;
    title: string;
    category?: string;
    thumbnail?: string;
  };
  buyer?: {
    name?: string;
    email?: string;
  };
};
