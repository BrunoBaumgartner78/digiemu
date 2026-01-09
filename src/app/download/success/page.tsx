import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DownloadCard from "./DownloadCard";
import ProcessingCard from "./ProcessingCard";
import SuccessPoller from "./SuccessPoller";

export const dynamic = "force-dynamic";

type SearchParams = { session_id?: string };
type Props = { searchParams: Promise<SearchParams> };

export default async function DownloadSuccessPage({ searchParams }: Props) {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/login");

  const { session_id } = await searchParams;
  const stripeSessionId = session_id;
  if (!stripeSessionId) return <ErrorState message="Ungültige Session-ID." />;

  const order = await prisma.order.findUnique({
    where: { stripeSessionId },
    include: {
      product: { select: { title: true } },
      downloadLink: true,
    },
  });

  // if order not yet created: show processing + poller
  if (!order) {
    return (
      <main className="page-center">
        <div className="neo-card max-w-md text-center space-y-4">
          <ProcessingCard />
          <SuccessPoller sessionId={stripeSessionId} />
        </div>
      </main>
    );
  }

  if (order.buyerId !== userId) {
    return <ErrorState message="Bestellung nicht gefunden." />;
  }

  // if order exists but download not ready: show poller
  if (!order.downloadLink || order.status !== "PAID") {
    return (
      <main className="page-center">
        <div className="neo-card max-w-md text-center space-y-4">
          <ProcessingCard />
          <SuccessPoller sessionId={stripeSessionId} />
        </div>
      </main>
    );
  }

  return (
    <main className="page-center">
      <div className="neo-card max-w-md text-center" style={{ marginBottom: 12 }}>
        <h2 className="neo-title">Vielen Dank für deinen Kauf</h2>
        <p className="neo-text">Dein Produkt steht jetzt zum Download bereit. Zusätzlich haben wir dir eine E-Mail mit deinem persönlichen Download-Link gesendet.</p>
      </div>

      <DownloadCard order={order} />
    </main>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="page-center">
      <div className="neo-card max-w-md text-center">
        <h1 className="neo-title">❌ Fehler</h1>
        <p className="neo-text">{message}</p>
      </div>
    </main>
  );
}
