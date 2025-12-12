import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";

// Falls du Firebase nutzt:
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/lib/firebase"; // <— anpassen falls anderer Pfad

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht eingeloggt" },
        { status: 401 }
      );
    }

    const orderId = params.orderId;

    // 1. Order holen
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { downloadLink: true, product: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order nicht gefunden" },
        { status: 404 }
      );
    }

    // 2. Besitzer prüfen
    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diesen Download" },
        { status: 403 }
      );
    }

    // 3. DownloadLink prüfen
    if (!order.downloadLink) {
      return NextResponse.json(
        { error: "Download noch nicht bereit" },
        { status: 404 }
      );
    }

    const link = order.downloadLink;

    // 4. Ablaufdatum prüfen
    if (link.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Downloadlink abgelaufen" },
        { status: 410 }
      );
    }

    // 5. Datei von Firebase holen (oder direkter Redirect)
    const storageRef = ref(storage, link.fileUrl);
    const url = await getDownloadURL(storageRef);

    // 6. Redirect zum tatsächlichen File-Storage
    return NextResponse.redirect(url);

  } catch (err: any) {
    console.error("DOWNLOAD ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Download fehlgeschlagen" },
      { status: 500 }
    );
  }
}
