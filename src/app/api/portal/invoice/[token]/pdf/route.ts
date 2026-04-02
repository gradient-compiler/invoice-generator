import path from "path";
import { db } from "@/db";
import { invoices, invoiceLineItems, clients, businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { renderInvoicePDF } from "@/pdf/render-pdf";
import { generatePayNowQR } from "@/lib/paynow-qr";
import { safeDecrypt } from "@/lib/crypto";
import type { InvoicePDFData } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    ensureDbInitialized();
    const { token } = await params;

    // Check token expiry first
    const tokenCheck = db
      .select({ shareTokenExpiresAt: invoices.shareTokenExpiresAt })
      .from(invoices)
      .where(eq(invoices.shareToken, token))
      .get();

    if (!tokenCheck) {
      return new Response("Invoice not found", { status: 404 });
    }

    if (tokenCheck.shareTokenExpiresAt && new Date(tokenCheck.shareTokenExpiresAt) < new Date()) {
      return new Response("Share link has expired", { status: 410 });
    }

    const invoice = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
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
      .where(eq(invoices.shareToken, token))
      .get();

    if (!invoice || invoice.status === "draft" || invoice.status === "cancelled") {
      return new Response("Invoice not found", { status: 404 });
    }

    const lineItems = db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoice.id))
      .orderBy(invoiceLineItems.sortOrder)
      .all();

    const settings = db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    let taxLabel: string | undefined;
    if (invoice.taxRate && invoice.taxRate > 0) {
      taxLabel = `GST (${invoice.taxRate}%)`;
    }

    let paynowQrDataUri: string | undefined;
    const decryptedPaynow = safeDecrypt(settings?.paynowNumber);
    if (decryptedPaynow) {
      try {
        const pn = decryptedPaynow.trim();
        const isPhone = /^\+?\d[\d\s-]{7,}$/.test(pn);
        paynowQrDataUri = await generatePayNowQR({
          ...(isPhone ? { mobile: pn.replace(/[\s-]/g, "") } : { uen: pn }),
          amount: invoice.total,
          reference: invoice.invoiceNumber,
          merchantName: settings?.businessName || undefined,
        });
      } catch {}
    }

    const pdfData: InvoicePDFData = {
      businessName: settings?.businessName || "",
      businessAddress: settings?.address || "",
      businessPhone: settings?.phone || undefined,
      businessEmail: settings?.email || undefined,
      logoPath: settings?.logoPath ? path.join(process.cwd(), "public", settings.logoPath) : undefined,
      gstNumber: safeDecrypt(settings?.gstNumber) || undefined,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status || "sent",
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
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Portal PDF error:", error);
    return new Response("Failed to generate PDF", { status: 500 });
  }
}
