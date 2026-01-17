export type MarketplaceProduct = {
  id: string;
  title: string;
  priceCents?: number | null;
  currency?: string | null;
  thumbnail?: string | null;
  description?: string | null;
  vendorId?: string | null;
  vendorProfile?: {
    displayName?: string | null;
    user?: { id?: string; name?: string | null } | null;
    avatarUrl?: string | null;
  } | null;
  vendor?: { id?: string; name?: string | null } | null;
};

export type CommentDTO = {
  id: string;
  content: string;
  createdAt: string;
  user?: { id: string; email?: string | null; name?: string | null } | null;
};

export type ReviewDTO = {
  id: string;
  rating: number;
  content?: string | null;
  createdAt: string;
  user?: { id: string; name?: string | null } | null;
};

export type LikeResponse = { liked: boolean };

export type TimePoint = { label: string; value: number };

export type FunnelDTO = {
  counts?: Record<string, number>;
  rates?: Record<string, number>;
};

export type ConversionDTO = {
  points: { date: string; views?: number; sales?: number; ctr?: number }[];
};

export type EarningsDTO = {
  points: { date: string; earningsCents: number }[];
};
