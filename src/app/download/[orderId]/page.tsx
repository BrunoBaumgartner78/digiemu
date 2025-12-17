// src/app/download/[orderId]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import styles from "./page.module.css";
import { DownloadButton } from "./DownloadButton";

export const dynamic = "force-dynamic";

type DownloadPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function DownloadPage(props: DownloadPageProps) {
  // ✅ Next 16: params ist Promise
  const { orderId } = await props.params;

  // 0) Login required
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    redirect(`/login?callbackUrl=/download/${orderId}`);
  }

  // 1) Order laden
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: { select: { title: true } },
      downloadLink: true,
    },
  });

  // 2) Buyer-Check
  if (!order || order.buyerId !== userId) {
    redirect("/marketplace");
  }

  // 3) Nur PAID
  if (order.status !== "PAID") {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <section className={`${styles.card} ${styles.cardWarning}`}>
            <h1 className={styles.title}>Zahlung noch nicht bestätigt</h1>
            <p className={styles.text}>
              Diese Bestellung ist noch nicht als bezahlt markiert.
            </p>
            <div className={styles.actions}>
              <Link href="/marketplace" className="neobtn primary">
                Zum Marketplace
              </Link>
              <Link href="/help" className="neobtn ghost">
                Hilfe
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const link = order.downloadLink;
  const now = new Date();

  const hasLink = Boolean(link?.fileUrl);
  const isExpired = hasLink && link!.expiresAt < now;
  const isInactive = hasLink && link!.isActive === false;
  const isLimitReached = hasLink && link!.downloadCount >= link!.maxDownloads;

  const canDownload = hasLink && !isExpired && !isInactive && !isLimitReached;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <section className={styles.card}>
          <h1 className={styles.title}>Download</h1>

          {canDownload ? (
            <>
              <p className={styles.text}>
                Produkt: <strong>{order.product?.title}</strong>
              </p>

              <div className={styles.actions}>
                <DownloadButton orderId={order.id} />
                <Link href="/account/downloads" className="neobtn ghost">
                  Meine Downloads
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className={styles.textError}>
                Dieser Download ist nicht mehr verfügbar.
              </p>
              <div className={styles.actions}>
                <Link href="/marketplace" className="neobtn primary">
                  Zum Marketplace
                </Link>
                <Link href="/help" className="neobtn ghost">
                  Hilfe
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
