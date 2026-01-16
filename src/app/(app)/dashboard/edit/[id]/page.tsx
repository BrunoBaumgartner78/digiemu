// src/app/dashboard/edit/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { isRecord, isString } from "@/lib/guards";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: { id: string };
};

export default async function DashboardEditLegacyPage({ params }: PageProps) {
  const session = await getServerSession(auth);
  const maybeUser = session?.user as unknown;
  let userId: string | undefined;
  if (isRecord(maybeUser)) {
    const idVal = (maybeUser as Record<string, unknown>).id;
    if (isString(idVal)) userId = idVal;
  }
  if (!userId) redirect("/login");

  const productId = String(params?.id ?? "").trim();
  if (!productId) notFound();

  // Minimal check: product exists and belongs to user (vendor)
  const p = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, vendorId: true, title: true },
  });

  if (!p) notFound();
  if (p.vendorId !== userId) redirect("/dashboard/products");

  // Wenn du schon die neue Edit-Route hast, leiten wir sauber dorthin:
  // /dashboard/products/[productId]/edit ist bei dir vorhanden.
  redirect(`/dashboard/products/${encodeURIComponent(p.id)}/edit`);
}
