import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import EditProductForm from "./EditProductForm";

// TODO: Implement ProductForm with file upload (Firebase), price, status, etc.

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "VENDOR") {
    redirect("/dashboard/products");
  }
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    // TODO: Add vendorId check for security
  });
  if (!product) {
    redirect("/dashboard/products");
  }

  // TODO: Handle POST for product update, file upload to Firebase, etc.

  // Neumorphism profile layout
  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-100/80 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-800">
            Profil & Einstellungen
          </h1>
          <p className="text-sm text-slate-500">
            Verwalte hier dein Verkäuferprofil, damit Kunden dir vertrauen
            und deine Produkte besser finden.
          </p>
        </header>

        {/* Card */}
        <div className="rounded-3xl bg-slate-100 shadow-[12px_12px_24px_rgba(15,23,42,0.18),_-10px_-10px_24px_rgba(255,255,255,0.9)] border border-slate-100/60">
          <div className="px-5 py-5 sm:px-8 sm:py-6 space-y-4">
            {/* Status-Badge + Meta */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-medium text-slate-800">
                  Verkäuferprofil
                </h2>
                <p className="text-xs text-slate-500">
                  Name, Beschreibung und weitere Details werden auf deinen
                  Produktseiten angezeigt.
                </p>
              </div>
              {/* Optional: status badge if available */}
              {/* TODO: If profile has isActive, render a badge here. */}
            </div>

            <div className="h-px bg-slate-200/70 my-2" />

            {/* Original content/form goes here */}
            <EditProductForm product={product} />
            {/* END original content/form */}
          </div>
        </div>
      </div>
    </div>
  );
}
