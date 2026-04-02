import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { invoices, clients, businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { sendEmail } from "@/lib/email";
import { requireAuth } from "@/lib/auth";
import { escapeHtml } from "@/lib/html";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    ensureDbInitialized();
    const authError = requireAuth(request);
    if (authError) return authError;

    // Rate limit: max 10 reminders per minute
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
        dueDate: invoices.dueDate,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
        clientName: clients.name,
        clientParentName: clients.parentName,
        clientEmail: clients.email,
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
    const businessName = settings?.businessName || "Invoice Generator";
    const balanceDue = invoice.total - (invoice.amountPaid ?? 0);
    const fc = (n: number) => `$${n.toFixed(2)}`;

    const isOverdue = new Date(invoice.dueDate) < new Date();
    const urgency = isOverdue ? "overdue" : "upcoming";

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${isOverdue ? "#dc2626" : "#333"};">Payment Reminder — Invoice ${escapeHtml(invoice.invoiceNumber)}</h2>
        <p>Dear ${escapeHtml(invoice.clientParentName || invoice.clientName)},</p>
        <p>This is a friendly reminder that invoice <strong>${escapeHtml(invoice.invoiceNumber)}</strong> ${isOverdue ? `was due on <strong>${escapeHtml(invoice.dueDate)}</strong> and is now overdue` : `is due on <strong>${escapeHtml(invoice.dueDate)}</strong>`}.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Invoice Total</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${fc(invoice.total)}</td></tr>
          ${(invoice.amountPaid ?? 0) > 0 ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Amount Paid</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${fc(invoice.amountPaid ?? 0)}</td></tr>` : ""}
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666; font-weight: bold;">Balance Due</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: ${isOverdue ? "#dc2626" : "#333"};">${fc(balanceDue)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Due Date</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${escapeHtml(invoice.dueDate)}</td></tr>
        </table>
        <p>Please arrange payment at your earliest convenience. If you have already made this payment, please disregard this reminder.</p>
        <p style="margin-top: 30px;">Thank you,<br/>${escapeHtml(businessName)}</p>
      </div>
    `;

    await sendEmail({
      to: invoice.clientEmail,
      subject: `Payment Reminder: Invoice ${invoice.invoiceNumber} — ${fc(balanceDue)} ${urgency}`,
      html,
    });

    logAudit({ action: "email_reminder", entityType: "email", entityId: invoiceId, request });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send reminder error:", error);
    const message = error instanceof Error ? error.message : "Failed to send reminder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
