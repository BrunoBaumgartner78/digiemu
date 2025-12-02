import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// TODO: Implement ProductForm with file upload (Firebase), price, status, etc.

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "VENDOR") {
    redirect("/dashboard/products");
  }

  // TODO: Handle POST for product creation, file upload to Firebase, etc.

  return (
    <main className="min-h-[70vh] w-full flex justify-center px-4 py-10 bg-gradient-to-br from-[#edf2ff] to-[#f9f9ff]">
      <div className="w-full max-w-2xl space-y-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Neues Produkt anlegen</h1>
          <p className="text-xs text-slate-500">Lade deine Datei hoch, setze Preis & Beschreibung</p>
          <Link href="/dashboard/products" className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition mt-2">Zurück zur Übersicht</Link>
        </header>
        <div className="rounded-3xl bg-white/90 shadow-lg shadow-slate-200/80 p-6 backdrop-blur-sm">
          {/* Product creation form */}
          {/* @ts-expect-error Async Server Component passing to Client Component */}
          <NewProductForm vendorId={session.user.id} />
        </div>
      </div>
    </main>
  );
}
