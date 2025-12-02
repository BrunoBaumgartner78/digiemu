import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  priceCents: z.string(),
  thumbnail: z.string().url().optional(),
  fileUrl: z.string().url(),
});
