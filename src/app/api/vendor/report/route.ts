// src/app/api/admin/vendors/report/route.ts
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const vendors = await prisma.user.findMany({
    where: { role: "VENDOR" },
  });

  const doc = new PDFDocument();
  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));
  doc.on("end", () => {});

  doc.fontSize(18).text("Vendor Report", { underline: true });
  doc.moveDown();

  vendors.forEach((v) => {
    doc.fontSize(12).text(`${v.email} – ${v.name ?? ""}`);
  });

  doc.end();

  const pdfBuffer = Buffer.concat(chunks);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="vendor-report.pdf"',
    },
  });
}
