import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Meine Käufe – DigiEmu",
  description: "Übersicht deiner gekauften digitalen Produkte und Downloads.",
};

export default async function DownloadsPage() {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="neumorph-card max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-bold mb-2">Bitte einloggen</h1>
          <p className="mb-4">Du musst eingeloggt sein, um deine Käufe zu sehen.</p>
          <Link href="/login" className="neobtn">
            Zum Login
          </Link>
        </div>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { buyerId: userId },
    orderBy: { createdAt: "desc" },
    include: { product: true, downloadLink: true },
  });

  return (
    <div className="min-h-screen px-4 py-8 md:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="section-header mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Meine Käufe &amp; Downloads</h1>
          <p className="text-sm text-muted">
            Hier findest du alle digitalen Produkte, die du über DigiEmu gekauft hast.
          </p>
        </header>

        {orders.length === 0 ? (
          <div className="neumorph-card p-8 text-center">
            <p className="opacity-80">Du hast bisher noch keine Käufe getätigt.</p>
            <Link href="/marketplace" className="neobtn mt-4 inline-flex">
              Zum Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const product = order.product;
              const downloadLink = order.downloadLink;

              const hasDownload = !!downloadLink?.fileUrl;
              const expired = !!downloadLink?.expiresAt && downloadLink.expiresAt < new Date();

              return (
                <div
                  key={order.id}
                  className="neumorph-card p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center"
                >
                  <div className="flex-1">
                    <h2 className="font-semibold text-base md:text-lg">{product?.title ?? "Produkt"}</h2>
                    <p className="text-xs text-muted mb-1">
                      Bestellt am{" "}
                      {order.createdAt.toLocaleDateString("de-CH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>

                    {/* optional: Status */}
                    <p className="text-xs text-muted">
                      Status: <span className="font-medium">{order.status}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2">
                    {hasDownload ? (
                      expired ? (
                        <span className="text-xs text-red-500">Download abgelaufen</span>
                      ) : (
                        <Link href={`/download/${order.id}`} className="neobtn-sm primary">
                          Download
                        </Link>
                      )
                    ) : (
                      <span className="text-xs text-muted">Download wird vorbereitet …</span>
                    )}

                    {product?.id ? (
                      <Link href={`/product/${product.id}`} className="nav-link text-xs">
                        Produktseite ansehen
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
