// src/app/dashboard/products/[productId]/edit-product/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { notFound, redirect } from "next/navigation";
import EditProductClient from "./edit-product/EditProductClient";

type PageProps = {
  params: { productId: string };
};

export default async function EditProductPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const product = await prisma.product.findUnique({
    where: { id: params.productId },
  });

  if (!product) {
    notFound();
  }

  return (
    <EditProductClient
      product={{
        id: product.id,
        title: product.title,
        description: product.description ?? "",
        priceCents: product.priceCents,
        fileUrl: product.fileUrl ?? "",
        thumbnail: product.thumbnail ?? null,
        isActive: product.isActive,
      }}
    />
  );
}
