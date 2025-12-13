import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function renderPdf(vendors: Array<{ email: string; name: string | null }>) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Vendor Report", { underline: true });
    doc.moveDown();

    vendors.forEach((v) => {
      doc.fontSize(12).text(`${v.email} – ${v.name ?? ""}`);
    });

    doc.end();
  });
}

export async function GET() {
  const vendors = await prisma.user.findMany({
    where: { role: "VENDOR" },
    select: { email: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  const pdfBuffer = await renderPdf(vendors);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="vendor-report.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
