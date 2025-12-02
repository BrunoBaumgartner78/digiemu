export interface SaleEntry {
  id: string;
  amountCents: number;
  createdAt: Date;

  product: {
    id: string;
    title: string;
    category: string;
    vendorId: string;
  };

  buyer?: {
    id: string;
    email: string;
  };

  downloadLink?: {
    id: string;
    fileUrl: string;
    expiresAt: Date;
  };
}
