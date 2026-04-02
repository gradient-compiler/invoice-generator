import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceLineItems, clients, businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { safeDecrypt } from "@/lib/crypto";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    ensureDbInitialized();

    // Rate limit portal access: max 30 requests per minute per IP
    const rl = checkRateLimit(`portal:${getClientIp(request)}`, { maxRequests: 30, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { token } = await params;

    // First check if token exists and is not expired
    const tokenCheck = db
      .select({
        shareTokenExpiresAt: invoices.shareTokenExpiresAt,
      })
      .from(invoices)
      .where(eq(invoices.shareToken, token))
      .get();

    if (!tokenCheck) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check share token expiry
    if (tokenCheck.shareTokenExpiresAt && new Date(tokenCheck.shareTokenExpiresAt) < new Date()) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 410 });
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
        amountPaid: invoices.amountPaid,
        notes: invoices.notes,
        paymentTerms: invoices.paymentTerms,
        clientName: clients.name,
        clientParentName: clients.parentName,
        clientEmail: clients.email,
        clientAddress: clients.address,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.shareToken, token))
      .get();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Don't show draft or cancelled invoices publicly
    if (invoice.status === "draft" || invoice.status === "cancelled") {
      return NextResponse.json({ error: "Invoice not available" }, { status: 404 });
    }

    const lineItems = db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoice.id))
      .orderBy(invoiceLineItems.sortOrder)
      .all();

    const settings = db
      .select({
        businessName: businessSettings.businessName,
        address: businessSettings.address,
        phone: businessSettings.phone,
        email: businessSettings.email,
        logoPath: businessSettings.logoPath,
        bankName: businessSettings.bankName,
        bankAccount: businessSettings.bankAccount,
        bankHolder: businessSettings.bankHolder,
        paynowNumber: businessSettings.paynowNumber,
      })
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    // Decrypt sensitive business fields for display
    const decryptedBusiness = settings
      ? {
          ...settings,
          bankAccount: safeDecrypt(settings.bankAccount),
          bankHolder: safeDecrypt(settings.bankHolder),
          paynowNumber: safeDecrypt(settings.paynowNumber),
        }
      : settings;

    logAudit({ action: "portal_access", entityType: "portal", entityId: invoice.invoiceNumber, request });
    return NextResponse.json({
      invoice,
      lineItems,
      business: decryptedBusiness,
    });
  } catch (error) {
    console.error("Portal invoice error:", error);
    return NextResponse.json({ error: "Failed to load invoice" }, { status: 500 });
  }
}
