// src/app/dashboard/products/[productId]/edit/page.tsx
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import EditProductForm from "./EditProductForm";

type PageProps = {
  // ✅ Next.js 16: params ist ein Promise
  params: Promise<{ productId: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: PageProps) {
  const { productId } = await params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const user = session.user as any;
  if (user.role !== "VENDOR" && user.role !== "ADMIN") {
    redirect("/login");
  }

  // Produkt laden – nur Felder, die wir wirklich brauchen
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      category: true,
      thumbnail: true,
      isActive: true,
      vendorId: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Vendor darf nur eigene Produkte bearbeiten (Admin darf alles)
  if (user.role === "VENDOR" && product.vendorId !== user.id) {
    redirect("/dashboard/products");
  }

  const initialPrice =
    typeof product.priceCents === "number"
      ? (product.priceCents / 100).toFixed(2)
      : "0.00";

  return (
    <main className="page-shell-wide">
      <EditProductForm
        id={product.id}
        initialTitle={product.title}
        initialDescription={product.description ?? ""}
        initialPrice={initialPrice}
        initialCategory={product.category ?? "other"}
        initialThumbnail={product.thumbnail ?? "/fallback-thumbnail.svg"}
        initialIsActive={product.isActive ?? true}
      />
    </main>
  );
}
