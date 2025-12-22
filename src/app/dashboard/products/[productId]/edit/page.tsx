// src/app/dashboard/products/[productId]/edit/page.tsx
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EditProductForm from "./EditProductForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: { productId: string };
};

export default async function EditProductPage({ params }: PageProps) {
  const pid = String(params?.productId ?? "").trim();
  if (!pid) notFound();

  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.id) redirect("/login");
  if (user.role !== "VENDOR" && user.role !== "ADMIN") redirect("/login");

  const product = await prisma.product.findUnique({
    where: { id: pid },
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      category: true,
      thumbnail: true,
      isActive: true,
      vendorId: true,
      status: true, // DRAFT | ACTIVE | BLOCKED
      vendor: { select: { isBlocked: true } },
    },
  });

  if (!product) notFound();

  // Vendor gesperrt -> raus
  if (product.vendor?.isBlocked) redirect("/login");

  // Vendor darf fremde Produkte nicht bearbeiten
  if (user.role === "VENDOR" && product.vendorId !== user.id) {
    redirect("/dashboard/products");
  }

  const initialPrice = ((product.priceCents ?? 0) / 100).toFixed(2);

  return (
    <main className="page-shell-wide">
      <EditProductForm
        id={product.id}
        initialTitle={product.title ?? ""}
        initialDescription={product.description ?? ""}
        initialPrice={initialPrice}
        initialCategory={product.category ?? "other"}
        initialThumbnail={product.thumbnail ?? "/fallback-thumbnail.svg"}
        initialIsActive={!!product.isActive}
        // ✅ neu: an Client geben, damit Button disabled wird / Hinweis angezeigt wird
        initialStatus={product.status ?? "DRAFT"}
      />
    </main>
  );
}
