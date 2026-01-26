/**
 * Shared UI types.
 * This file exists because several UI components import from "@/types/ui".
 * Keep it tiny + stable.
 */

export type SortMode = "new" | "top";

export type BadgeKind = "ADMIN" | "SELLER" | "VERIFIED_BUYER";

export type ApiErrorShape = {
  error?: string;
  message?: string;
};

export type CommentItem = {
  id: string;
  text: string;
  createdAt?: string;
  authorName?: string | null;
  badges?: BadgeKind[] | string[];
  likesCount?: number;
  viewerHasLiked?: boolean;
};

export type CommentsResponse = {
  items: CommentItem[];
  count?: number;
  sort?: SortMode;
};

export type ReviewItem = {
  id: string;
  rating: number; // 1..5
  text?: string | null;
  createdAt?: string;
  authorName?: string | null;
};

export type ReviewsResponse = {
  items: ReviewItem[];
  count?: number;
};
export type MarketplaceProduct = {
  id: string;
  title: string;
  priceCents?: number | null;
  currency?: string | null;
  thumbnail?: string | null;
  description?: string | null;
  vendorId?: string | null;
  vendorProfile?: {
    id?: string | null;
    displayName?: string | null;
    user?: { id?: string; name?: string | null } | null;
    avatarUrl?: string | null;
    isPublic?: boolean | null;
  } | null;
  vendor?: { id?: string; name?: string | null } | null;
  category?: string | null;
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
