import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceLineItems, clients, sessions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureDbInitialized();
    const { id } = await params;

    const invoice = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        clientId: invoices.clientId,
        clientName: clients.name,
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
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.id, parseInt(id)))
      .get();

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const lineItems = db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, parseInt(id)))
      .orderBy(invoiceLineItems.sortOrder)
      .all();

    return NextResponse.json({ ...invoice, lineItems });
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
    ensureDbInitialized();
    const { id } = await params;
    const body = await request.json();

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

    const { lineItems, ...invoiceFields } = body;

    // Recalculate totals if line items are provided
    if (lineItems && Array.isArray(lineItems)) {
      // Delete existing line items
      db.delete(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, parseInt(id)))
        .run();

      // Insert new line items
      const items = lineItems.map(
        (
          item: {
            description: string;
            quantity: number;
            unitPrice: number;
            unitLabel?: string;
            amount?: number;
            sortOrder?: number;
            sessionId?: number;
          },
          index: number
        ) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitLabel: item.unitLabel || "hr",
          amount: item.amount ?? item.quantity * item.unitPrice,
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
        invoiceFields.discountType ?? existing.discountType;
      const discountValue =
        invoiceFields.discountValue ?? existing.discountValue ?? 0;

      let discountAmount = 0;
      if (discountType === "percentage" && discountValue) {
        discountAmount = subtotal * (discountValue / 100);
      } else if (discountType === "fixed" && discountValue) {
        discountAmount = discountValue;
      }

      const afterDiscount = subtotal - discountAmount;
      const taxRate = invoiceFields.taxRate ?? existing.taxRate ?? 0;
      const taxAmount = afterDiscount * (taxRate / 100);
      const total = afterDiscount + taxAmount;

      invoiceFields.subtotal = subtotal;
      invoiceFields.discountAmount = discountAmount;
      invoiceFields.taxAmount = taxAmount;
      invoiceFields.total = total;
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
