import { z } from "zod";

export const profileSchema = z.object({
  displayName: z.string().min(3).max(120).optional().or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
  avatarUrl: z.string().url().max(500).optional().or(z.literal("")),
  bannerUrl: z.string().url().max(500).optional().or(z.literal("")),
  websiteUrl: z.string().url().max(500).optional().or(z.literal("")),
  twitterUrl: z.string().url().max(500).optional().or(z.literal("")),
  instagramUrl: z.string().url().max(500).optional().or(z.literal("")),
  tiktokUrl: z.string().url().max(500).optional().or(z.literal("")),
  facebookUrl: z.string().url().max(500).optional().or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
