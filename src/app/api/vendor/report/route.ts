// src/app/api/vendor/report/route.ts
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import { ProductStatus, VendorStatus, PayoutStatus, Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function renderPdf(vendors: Array<{ email: string; name: string | null }>) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Vendor Report", { underline: true });
    doc.moveDown();

    for (const v of vendors) {
      doc.fontSize(12).text(`${v.email} – ${v.name ?? ""}`);
    }

    doc.end();
  });
}

export async function GET() {
  const vendors = await prisma.user.findMany({
    where: { role: Role.VENDOR },
    select: { email: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  const pdfBuffer = await renderPdf(vendors);

  // TS in deiner Setup-Kombi akzeptiert Buffer/Uint8Array nicht sauber als BodyInit,
  // deshalb: gezielter Cast (Runtime ist korrekt, weil Node runtime).
  return new Response(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="vendor-report.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
