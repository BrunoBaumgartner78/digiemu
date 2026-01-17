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
