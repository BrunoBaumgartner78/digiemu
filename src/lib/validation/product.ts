import { z } from "zod";

export const createProductSchema = z.object({
  title: z
    .string()
    .min(3, "Titel muss mindestens 3 Zeichen haben.")
    .max(120, "Titel darf maximal 120 Zeichen haben."),
  description: z
    .string()
    .min(10, "Beschreibung muss mindestens 10 Zeichen haben.")
    .max(2000, "Beschreibung darf maximal 2000 Zeichen haben."),
  priceCents: z
    .number()
    .int("Preis muss eine ganze Zahl sein.")
    .positive("Preis muss positiv sein."),
  category: z
    .string()
    .min(2, "Kategorie muss mindestens 2 Zeichen haben.")
    .max(50, "Kategorie darf maximal 50 Zeichen haben."),
  fileUrl: z.string().url("fileUrl muss eine gültige URL sein."),
  thumbnail: z.string().url().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
