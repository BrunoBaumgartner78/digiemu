// src/app/dashboard/products/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DashboardProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "VENDOR") {
    redirect("/dashboard");
  }
  const vendorId = session.user.id;
  // Fetch products for vendor, include downloads count
  const products = await prisma.product.findMany({
    where: { vendorId },
    orderBy: { updatedAt: "desc" },
    include: {
      orders: true,
    },
  });

  return (
    <main className="min-h-[70vh] w-full flex justify-center px-4 py-10 bg-gradient-to-br from-[#edf2ff] to-[#f8f9ff]">
      <div className="w-full max-w-6xl space-y-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Deine Produkte</h1>
            <p className="text-xs text-slate-500">Verwalte digitale Dateien, Preise & Sichtbarkeit</p>
          </div>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-md shadow-indigo-200 hover:bg-indigo-500 transition"
          >
            <span className="mr-2">+</span> Neues Produkt
          </Link>
        </header>
        <div className="rounded-3xl bg-white/90 shadow-lg shadow-slate-200/80 p-6 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-2 px-3"></th>
                  <th className="py-2 px-3 text-left font-semibold text-slate-700">Titel</th>
                  <th className="py-2 px-3 text-left font-semibold text-slate-700">Preis</th>
                  <th className="py-2 px-3 text-left font-semibold text-slate-700">Downloads</th>
                  <th className="py-2 px-3 text-left font-semibold text-slate-700">Status</th>
                  <th className="py-2 px-3 text-left font-semibold text-slate-700">Zuletzt aktualisiert</th>
                  <th className="py-2 px-3 text-left font-semibold text-slate-700">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl">📂</span>
                        <span className="font-semibold">Noch keine Produkte</span>
                        <span className="text-xs">Lege jetzt dein erstes digitales Produkt an.</span>
                        <Link href="/dashboard/new" className="mt-2 inline-flex items-center rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-md shadow-indigo-200 hover:bg-indigo-500 transition">Erstes Produkt anlegen</Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100">
                      <td className="py-2 px-3">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt={product.title} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">?</div>
                        )}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">{product.title}</td>
                      <td className="py-2 px-3">{(product.priceCents / 100).toFixed(2)} CHF</td>
                      <td className="py-2 px-3">{product.orders.length}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${product.status === "PUBLISHED" ? "bg-green-100 text-green-700" : product.status === "DRAFT" ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">{new Date(product.updatedAt).toLocaleDateString("de-CH")}</td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2">
                          <Link href={`/dashboard/products/${product.id}/edit-product`} className="text-xs text-indigo-600 hover:underline">Bearbeiten</Link>
                          <Link href={`/product/${product.id}`} className="text-xs text-slate-600 hover:underline">Ansehen</Link>
                          <Link href={`/dashboard/product/${product.id}/stats`} className="text-xs text-slate-600 hover:underline">Stats</Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
