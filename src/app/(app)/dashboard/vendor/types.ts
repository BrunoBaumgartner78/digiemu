export type VendorPayoutRow = {
  id: string;
  amountCents: number;
  status: string;
  createdAt: string | Date;
  paidAt?: string | Date | null;
};
