import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function AccountOrdersPage() {
  const session = await getServerSession(auth);
  if (!session?.user?.id) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <h2 className="text-xl font-bold mb-4">Nicht eingeloggt</h2>
        <Link href="/login" className="text-blue-500 underline">Jetzt einloggen</Link>
      </div>
    );
  }
  const orders = await prisma.order.findMany({
    where: { buyerId: session.user.id },
    include: { product: true, downloadLink: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-8">Meine Käufe</h1>
      {orders.length === 0 ? (
        <div className="text-gray-400">Du hast noch keine Produkte gekauft.</div>
      ) : (
        <table className="min-w-full bg-[#232323] rounded-lg">
          <thead>
            <tr className="text-left text-white">
              <th className="px-4 py-2">Produkt</th>
              <th className="px-4 py-2">Kaufdatum</th>
              <th className="px-4 py-2">Preis (CHF)</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Download</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              let downloadStatus = "Ausstehend";
              let downloadLink = null;
              let badgeColor = "bg-yellow-600";
              if (order.downloadLink) {
                const expired = new Date(order.downloadLink.expiresAt) < new Date();
                if (expired) {
                  downloadStatus = "Abgelaufen";
                  badgeColor = "bg-red-600";
                } else {
                  downloadStatus = "Download";
                  badgeColor = "bg-green-600";
                  downloadLink = (
                    <Link href={`/download/${order.id}`} className="px-2 py-1 bg-[#39FF14] text-[#1A1A1A] rounded font-bold">Download</Link>
                  );
                }
              }
              return (
                <tr key={order.id} className="border-t border-gray-700 text-white">
                  <td className="px-4 py-2">{order.product?.title || "-"}</td>
                  <td className="px-4 py-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{(order.amountCents / 100).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${badgeColor}`}>{downloadStatus}</span>
                  </td>
                  <td className="px-4 py-2">{downloadLink || <span className="text-gray-400">{downloadStatus}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
