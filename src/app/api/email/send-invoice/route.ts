import path from "path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { invoices, invoiceLineItems, clients, businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { renderInvoicePDF } from "@/pdf/render-pdf";
import { generatePayNowQR } from "@/lib/paynow-qr";
import { sendEmail } from "@/lib/email";
import { requireAuth } from "@/lib/auth";
import { safeDecrypt } from "@/lib/crypto";
import { escapeHtml } from "@/lib/html";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import type { InvoicePDFData } from "@/types";

export async function POST(request: Request) {
  try {
    ensureDbInitialized();
    const authError = requireAuth(request);
    if (authError) return authError;

    // Rate limit: max 10 emails per minute
    const rl = checkRateLimit(`email:${getClientIp(request)}`, { maxRequests: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const bodySchema = z.object({ invoiceId: z.number().int().positive("invoiceId required") });
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    const { invoiceId } = parsed.data;

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
        amountPaid: invoices.amountPaid,
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
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (!invoice.clientEmail) {
      return NextResponse.json({ error: "Client has no email address" }, { status: 400 });
    }

    const settings = db.select().from(businessSettings).where(eq(businessSettings.id, 1)).get();
    const lineItems = db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId)).orderBy(invoiceLineItems.sortOrder).all();

    // Generate PayNow QR — decrypt the stored paynow number
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

    let taxLabel: string | undefined;
    if (invoice.taxRate && invoice.taxRate > 0) {
      taxLabel = `GST (${invoice.taxRate}%)`;
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

    const pdfBuffer = await renderInvoicePDF(pdfData, invoice.template || "clean-professional");
    const businessName = settings?.businessName || "Invoice Generator";
    const fc = (n: number) => `$${n.toFixed(2)}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invoice ${escapeHtml(invoice.invoiceNumber)}</h2>
        <p>Dear ${escapeHtml(invoice.clientParentName || invoice.clientName)},</p>
        <p>Please find attached invoice <strong>${escapeHtml(invoice.invoiceNumber)}</strong> from ${escapeHtml(businessName)}.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Total</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${fc(invoice.total)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Due Date</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${escapeHtml(invoice.dueDate)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Payment Terms</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${escapeHtml(invoice.paymentTerms || "Due upon receipt")}</td></tr>
        </table>
        <p style="color: #666; font-size: 14px;">The invoice PDF is attached to this email.</p>
        <p style="margin-top: 30px;">Thank you,<br/>${escapeHtml(businessName)}</p>
      </div>
    `;

    await sendEmail({
      to: invoice.clientEmail,
      subject: `Invoice ${invoice.invoiceNumber} from ${businessName}`,
      html,
      attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: Buffer.from(pdfBuffer) }],
    });

    logAudit({ action: "email_send", entityType: "email", entityId: invoiceId, request });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send invoice email error:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
