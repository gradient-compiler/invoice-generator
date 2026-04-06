import path from "path";
import { db } from "@/db";
import { receipts, invoices, clients, businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { renderReceiptPDF } from "@/pdf/render-receipt";
import { safeDecrypt } from "@/lib/crypto";
import type { ReceiptPDFData } from "@/types";
import { formatDisplayDate } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureDbInitialized();
    const { id } = await params;
    const receiptId = parseInt(id);

    // Fetch receipt with invoice and client info
    const receipt = db
      .select({
        id: receipts.id,
        receiptNumber: receipts.receiptNumber,
        invoiceId: receipts.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        paymentDate: receipts.paymentDate,
        paymentMethod: receipts.paymentMethod,
        amount: receipts.amount,
        notes: receipts.notes,
        currency: invoices.currency,
        clientName: clients.name,
        clientParentName: clients.parentName,
      })
      .from(receipts)
      .leftJoin(invoices, eq(receipts.invoiceId, invoices.id))
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(receipts.id, receiptId))
      .get();

    if (!receipt) {
      return new Response("Receipt not found", { status: 404 });
    }

    // Fetch business settings
    const settings = db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    // Build PDF data
    const pdfData: ReceiptPDFData = {
      businessName: settings?.businessName || "",
      businessAddress: settings?.address || "",
      businessPhone: settings?.phone || undefined,
      businessEmail: settings?.email || undefined,
      logoPath: settings?.logoPath
        ? path.join(process.cwd(), "public", settings.logoPath)
        : undefined,

      receiptNumber: receipt.receiptNumber,
      invoiceNumber: receipt.invoiceNumber || "",
      paymentDate: formatDisplayDate(receipt.paymentDate),
      paymentMethod: receipt.paymentMethod || "",
      amount: receipt.amount,
      currency: receipt.currency || "SGD",

      clientName: receipt.clientName || "",
      clientParentName: safeDecrypt(receipt.clientParentName) || undefined,

      notes: receipt.notes || undefined,
    };

    const pdfBuffer = await renderReceiptPDF(pdfData);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${receipt.receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Generate receipt PDF error:", error);
    return new Response("Failed to generate PDF", { status: 500 });
  }
}
