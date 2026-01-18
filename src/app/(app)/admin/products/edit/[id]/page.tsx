import { redirect, notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import AdminProductEditClient from "./AdminProductEditClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: { id: string } | Promise<{ id: string }>;
};

export default async function AdminProductEditPage({ params }: PageProps) {
  const { id } = await Promise.resolve(params);
  const productId = String(id || "").trim();
  if (!productId) notFound();

  const session = await requireAdminPage();
  if (!session) redirect("/login");
  if (!session.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const p = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      fileUrl: true,
      thumbnail: true,
      category: true,
      isActive: true,
      status: true,
      moderationNote: true,
      createdAt: true,
      vendor: { select: { email: true, isBlocked: true } },
    },
  });

  if (!p) notFound();

  return (
    <main className="page-shell-wide">
      <AdminProductEditClient
        initialProduct={{
          id: p.id,
          title: p.title ?? "",
          description: p.description ?? "",
          priceCents: p.priceCents ?? 0,
          fileUrl: p.fileUrl ?? "",
          thumbnail: p.thumbnail ?? "",
          category: p.category ?? "other",
          isActive: !!p.isActive,
          status: (p.status as "DRAFT" | "ACTIVE" | "BLOCKED") ?? "DRAFT",
          moderationNote: p.moderationNote ?? "",
          vendorEmail: p.vendor?.email ?? "unbekannt",
          vendorIsBlocked: !!p.vendor?.isBlocked,
          createdAtISO: p.createdAt.toISOString(),
        }}
      />
    </main>
  );
}
