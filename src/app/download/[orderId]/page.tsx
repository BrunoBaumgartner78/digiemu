import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DownloadPage({ params }: any) {
  const session = await getServerSession();

  if (!session?.user?.id) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { downloadLink: true },
  });

  if (!order) return <div>Bestellung nicht gefunden.</div>;
  if (order.buyerId !== session.user.id) return <div>Keine Berechtigung.</div>;

  const link = order.downloadLink;
  if (!link) return <div>Download noch nicht bereit.</div>;

  if (new Date(link.expiresAt) < new Date())
    return <div>Download-Link ist abgelaufen.</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Danke für deinen Kauf!</h1>
      <p>Deine Datei steht jetzt bereit:</p>

      <a
        href={link.fileUrl}
        download
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Datei herunterladen
      </a>
    </div>
  );
}
