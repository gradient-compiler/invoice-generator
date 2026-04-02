import path from "path";
import { db } from "@/db";
import {
  invoices,
  invoiceLineItems,
  clients,
  businessSettings,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { renderInvoicePDF } from "@/pdf/render-pdf";
import { generatePayNowQR } from "@/lib/paynow-qr";
import { safeDecrypt } from "@/lib/crypto";
import { requireAuth } from "@/lib/auth";
import type { InvoicePDFData } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureDbInitialized();
    const authError = requireAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const invoiceId = parseInt(id);

    // Fetch invoice with client info
    const invoice = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        clientId: invoices.clientId,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        currency: invoices.currency,
        subtotal: invoices.subtotal,
        discountAmount: invoices.discountAmount,
        discountLabel: invoices.discountLabel,
        taxRate: invoices.taxRate,
        taxAmount: invoices.taxAmount,
        total: invoices.total,
        notes: invoices.notes,
        paymentTerms: invoices.paymentTerms,
        lateFeeNote: invoices.lateFeeNote,
        template: invoices.template,
        clientName: clients.name,
        clientParentName: clients.parentName,
        clientEmail: clients.email,
        clientPhone: clients.phone,
        clientAddress: clients.address,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.id, invoiceId))
      .get();

    if (!invoice) {
      return new Response("Invoice not found", { status: 404 });
    }

    // Fetch line items
    const lineItems = db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId))
      .orderBy(invoiceLineItems.sortOrder)
      .all();

    // Fetch business settings
    const settings = db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    // Build tax label
    let taxLabel: string | undefined;
    if (invoice.taxRate && invoice.taxRate > 0) {
      taxLabel = `GST (${invoice.taxRate}%)`;
    }

    // Generate PayNow QR if configured — decrypt stored paynow number
    let paynowQrDataUri: string | undefined;
    const decryptedPaynow = safeDecrypt(settings?.paynowNumber);
    if (decryptedPaynow) {
      try {
        const pn = decryptedPaynow.trim();
        // Detect if the value looks like a phone number (starts with + or 6/8/9 digit)
        const isPhone = /^\+?\d[\d\s-]{7,}$/.test(pn);
        paynowQrDataUri = await generatePayNowQR({
          ...(isPhone ? { mobile: pn.replace(/[\s-]/g, "") } : { uen: pn }),
          amount: invoice.total,
          reference: invoice.invoiceNumber,
          merchantName: settings?.businessName || undefined,
        });
      } catch {
        // QR generation is non-critical
      }
    }

    // Build PDF data
    const pdfData: InvoicePDFData = {
      businessName: settings?.businessName || "",
      businessAddress: settings?.address || "",
      businessPhone: settings?.phone || undefined,
      businessEmail: settings?.email || undefined,
      logoPath: settings?.logoPath
        ? path.join(process.cwd(), "public", settings.logoPath)
        : undefined,
      gstNumber: safeDecrypt(settings?.gstNumber) || undefined,

      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status || "draft",

      clientName: invoice.clientName || "",
      clientParentName: invoice.clientParentName || undefined,
      clientAddress: invoice.clientAddress || undefined,
      clientPhone: invoice.clientPhone || undefined,
      clientEmail: invoice.clientEmail || undefined,

      lineItems: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitLabel: item.unitLabel || "hr",
        amount: item.amount,
      })),

      subtotal: invoice.subtotal,
      discountLabel: invoice.discountLabel || undefined,
      discountAmount: invoice.discountAmount || 0,
      taxLabel,
      taxAmount: invoice.taxAmount || 0,
      total: invoice.total,
      currency: invoice.currency || "SGD",

      paymentTerms: invoice.paymentTerms || "",
      lateFeeNote: invoice.lateFeeNote || undefined,
      bankName: settings?.bankName || undefined,
      bankAccount: safeDecrypt(settings?.bankAccount) || undefined,
      bankHolder: safeDecrypt(settings?.bankHolder) || undefined,
      paynowQrDataUri,

      notes: invoice.notes || undefined,
    };

    const templateSlug = invoice.template || "clean-professional";
    const pdfBuffer = await renderInvoicePDF(pdfData, templateSlug);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Generate invoice PDF error:", error);
    return new Response("Failed to generate PDF", { status: 500 });
  }
}
