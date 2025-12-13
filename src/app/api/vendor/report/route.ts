// src/app/api/vendor/report/route.ts
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function renderPdf(vendors: Array<{ email: string; name: string | null }>) {
  return new Promise<Uint8Array>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // pdfkit emittet Buffer/Uint8Array
    const chunks: Uint8Array[] = [];

    doc.on("data", (chunk: any) => {
      // Buffer ist auch ein Uint8Array → passt
      const u8 = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
      chunks.push(u8);
    });

    doc.on("end", () => {
      const total = chunks.reduce((sum, c) => sum + c.length, 0);
      const merged = new Uint8Array(total);

      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }

      resolve(merged);
    });

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
    where: { role: "VENDOR" },
    select: { email: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  const pdfBytes = await renderPdf(vendors);

  // ✅ NextResponse erwartet BodyInit → ArrayBuffer ist typ-sicher
  const body = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  );

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="vendor-report.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
