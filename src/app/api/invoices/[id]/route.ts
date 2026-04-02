import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceLineItems, clients, sessions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { invoiceSchema } from "@/lib/validators";
import { parseId } from "@/lib/parse-id";

const INVOICE_UPDATABLE_FIELDS = new Set([
  "clientId", "status", "issueDate", "dueDate", "currency", "subtotal",
  "discountAmount", "discountType", "discountValue", "discountLabel",
  "taxRate", "taxAmount", "total", "amountPaid", "notes", "paymentTerms",
  "lateFeeNote", "template", "billingMonth",
]);

function pickAllowed<T extends Record<string, unknown>>(obj: T, allowed: Set<string>): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (allowed.has(key)) result[key] = obj[key];
  }
  return result as Partial<T>;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;
    const result = parseId(id);
    if ("error" in result) return result.error;
    const numericId = result.id;

    const row = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        clientId: invoices.clientId,
        clientName: clients.name,
        clientParentName: clients.parentName,
        clientEmail: clients.email,
        clientPhone: clients.phone,
        clientAddress: clients.address,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        currency: invoices.currency,
        subtotal: invoices.subtotal,
        discountAmount: invoices.discountAmount,
        discountType: invoices.discountType,
        discountValue: invoices.discountValue,
        discountLabel: invoices.discountLabel,
        taxRate: invoices.taxRate,
        taxAmount: invoices.taxAmount,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
        notes: invoices.notes,
        paymentTerms: invoices.paymentTerms,
        lateFeeNote: invoices.lateFeeNote,
        template: invoices.template,
        billingMonth: invoices.billingMonth,
        duplicatedFrom: invoices.duplicatedFrom,
        shareToken: invoices.shareToken,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.id, numericId))
      .get();

    if (!row) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const lineItems = db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, numericId))
      .orderBy(invoiceLineItems.sortOrder)
      .all();

    const { clientName, clientParentName, clientEmail, clientPhone, clientAddress, ...invoice } = row;
    return NextResponse.json({
      ...invoice,
      client: {
        id: row.clientId,
        name: clientName,
        parentName: clientParentName,
        email: clientEmail,
        phone: clientPhone,
        address: clientAddress,
      },
      lineItems,
    });
  } catch (error) {
    console.error("Get invoice error:", error);
    return NextResponse.json(
      { error: "Failed to get invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;
    const parsed_id = parseId(id);
    if ("error" in parsed_id) return parsed_id.error;
    const numericId = parsed_id.id;
    const body = await request.json();
    const parsed = invoiceSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(invoices)
      .where(eq(invoices.id, parseInt(id)))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const { lineItems, ...validatedFields } = parsed.data;
    const invoiceFields: Record<string, unknown> = pickAllowed(
      validatedFields as Record<string, unknown>,
      INVOICE_UPDATABLE_FIELDS
    );

    // Recalculate totals if line items are provided
    if (lineItems && Array.isArray(lineItems)) {
      // Delete existing line items
      db.delete(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, parseInt(id)))
        .run();

      // Insert new line items
      const items = lineItems.map(
        (
          item,
          index: number
        ) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitLabel: item.unitLabel || "hr",
          amount: item.quantity * item.unitPrice,
          sortOrder: item.sortOrder ?? index,
          sessionId: item.sessionId || null,
        })
      );

      for (const item of items) {
        db.insert(invoiceLineItems)
          .values({
            invoiceId: parseInt(id),
            ...item,
          })
          .run();
      }

      // Recalculate totals
      const subtotal = items.reduce(
        (sum: number, item: { amount: number }) => sum + item.amount,
        0
      );
      const discountType =
        (validatedFields.discountType ?? existing.discountType) as string | null;
      const discountValue =
        (validatedFields.discountValue ?? existing.discountValue ?? 0) as number;

      let discountAmount = 0;
      if (discountType === "percentage" && discountValue) {
        discountAmount = subtotal * (discountValue / 100);
      } else if (discountType === "fixed" && discountValue) {
        discountAmount = discountValue;
      }

      const afterDiscount = subtotal - discountAmount;
      const taxRate = (validatedFields.taxRate ?? existing.taxRate ?? 0) as number;
      const taxAmount = afterDiscount * (taxRate / 100);
      const total = afterDiscount + taxAmount;

      invoiceFields.subtotal = subtotal;
      invoiceFields.discountAmount = discountAmount;
      invoiceFields.taxAmount = taxAmount;
      invoiceFields.total = total;
    }

    // When marking as paid, ensure amountPaid is set
    if (invoiceFields.status === "paid" && !invoiceFields.amountPaid) {
      invoiceFields.amountPaid = invoiceFields.total ?? existing.total;
    }

    const result = db
      .update(invoices)
      .set({
        ...invoiceFields,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(invoices.id, parseInt(id)))
      .returning()
      .get();

    const updatedLineItems = db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, parseInt(id)))
      .orderBy(invoiceLineItems.sortOrder)
      .all();

    return NextResponse.json({ ...result, lineItems: updatedLineItems });
  } catch (error) {
    console.error("Update invoice error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;
    const invoiceId = parseInt(id);

    const existing = db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Unlink sessions that reference this invoice
    db.update(sessions)
      .set({ invoiceId: null })
      .where(eq(sessions.invoiceId, invoiceId))
      .run();

    // Delete line items (cascade should handle this, but be explicit)
    db.delete(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId))
      .run();

    // Delete the invoice
    db.delete(invoices).where(eq(invoices.id, invoiceId)).run();

    return NextResponse.json({ message: "Invoice deleted" });
  } catch (error) {
    console.error("Delete invoice error:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
