import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  invoices,
  invoiceLineItems,
  clients,
  businessSettings,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { invoiceSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const billingMonth = searchParams.get("billingMonth");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const conditions = [];

    if (status) {
      conditions.push(eq(invoices.status, status));
    }
    if (clientId) {
      conditions.push(eq(invoices.clientId, parseInt(clientId)));
    }
    if (billingMonth) {
      conditions.push(eq(invoices.billingMonth, billingMonth));
    }
    if (dateFrom) {
      conditions.push(sql`${invoices.issueDate} >= ${dateFrom}`);
    }
    if (dateTo) {
      conditions.push(sql`${invoices.issueDate} <= ${dateTo}`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        clientId: invoices.clientId,
        clientName: clients.name,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        currency: invoices.currency,
        subtotal: invoices.subtotal,
        discountAmount: invoices.discountAmount,
        taxRate: invoices.taxRate,
        taxAmount: invoices.taxAmount,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
        billingMonth: invoices.billingMonth,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(where)
      .orderBy(sql`${invoices.issueDate} DESC`)
      .all();

    return NextResponse.json(result);
  } catch (error) {
    console.error("List invoices error:", error);
    return NextResponse.json(
      { error: "Failed to list invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();

    const body = await request.json();
    const parsed = invoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    const {
      clientId,
      issueDate,
      dueDate,
      currency,
      discountType,
      discountValue,
      discountLabel,
      taxRate,
      notes,
      paymentTerms,
      lateFeeNote,
      template,
      billingMonth,
      lineItems,
    } = parsed.data;

    // Get settings for invoice number generation
    const settings = db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    const prefix = settings?.invoicePrefix || "INV";
    const nextNum = settings?.nextInvoiceNum || 1;
    const invoiceNumber = `${prefix}-${String(nextNum).padStart(5, "0")}`;

    // Atomically increment the next invoice number
    db.update(businessSettings)
      .set({ nextInvoiceNum: nextNum + 1 })
      .where(eq(businessSettings.id, 1))
      .run();

    // Calculate subtotal from line items
    const items = (lineItems || []).map(
      (
        item: {
          description: string;
          quantity: number;
          unitPrice: number;
          unitLabel?: string;
          amount?: number;
          sortOrder?: number;
          sessionId?: number | null;
        },
        index: number
      ) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitLabel: item.unitLabel || "hr",
        amount: item.amount ?? item.quantity * item.unitPrice,
        sortOrder: item.sortOrder ?? index,
        sessionId: item.sessionId ?? undefined,
      })
    );

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

    // Apply discount
    let discountAmount = 0;
    if (discountType === "percentage" && discountValue) {
      discountAmount = subtotal * (discountValue / 100);
    } else if (discountType === "fixed" && discountValue) {
      discountAmount = discountValue;
    }

    const afterDiscount = subtotal - discountAmount;

    // Apply tax
    const effectiveTaxRate = taxRate || 0;
    const taxAmount = afterDiscount * (effectiveTaxRate / 100);
    const total = afterDiscount + taxAmount;

    // Create invoice
    const invoice = db
      .insert(invoices)
      .values({
        invoiceNumber,
        clientId,
        status: "draft",
        issueDate,
        dueDate,
        currency: currency || "SGD",
        subtotal,
        discountAmount,
        discountType: discountType || null,
        discountValue: discountValue || 0,
        discountLabel: discountLabel || null,
        taxRate: effectiveTaxRate,
        taxAmount,
        total,
        amountPaid: 0,
        notes: notes || null,
        paymentTerms: paymentTerms || settings?.defaultPaymentTerms || "Due upon receipt",
        lateFeeNote: lateFeeNote || settings?.latePaymentNote || null,
        template: template || settings?.defaultTemplate || "clean-professional",
        billingMonth: billingMonth || null,
      })
      .returning()
      .get();

    // Insert line items
    for (const item of items) {
      db.insert(invoiceLineItems)
        .values({
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitLabel: item.unitLabel || "hr",
          amount: item.amount,
          sortOrder: item.sortOrder ?? 0,
          sessionId: item.sessionId || null,
        })
        .run();
    }

    const createdLineItems = db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoice.id))
      .all();

    return NextResponse.json(
      { ...invoice, lineItems: createdLineItems },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
