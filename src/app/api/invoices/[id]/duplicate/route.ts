import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceLineItems, businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureDbInitialized();
    const { id } = await params;
    const originalId = parseInt(id);

    const original = db
      .select()
      .from(invoices)
      .where(eq(invoices.id, originalId))
      .get();

    if (!original) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Generate new invoice number
    const settings = db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    const prefix = settings?.invoicePrefix || "INV";
    const nextNum = settings?.nextInvoiceNum || 1;
    const invoiceNumber = `${prefix}-${String(nextNum).padStart(5, "0")}`;

    db.update(businessSettings)
      .set({ nextInvoiceNum: nextNum + 1 })
      .where(eq(businessSettings.id, 1))
      .run();

    // Create duplicated invoice
    const newInvoice = db
      .insert(invoices)
      .values({
        invoiceNumber,
        clientId: original.clientId,
        status: "draft",
        issueDate: original.issueDate,
        dueDate: original.dueDate,
        currency: original.currency,
        subtotal: original.subtotal,
        discountAmount: original.discountAmount,
        discountType: original.discountType,
        discountValue: original.discountValue,
        discountLabel: original.discountLabel,
        taxRate: original.taxRate,
        taxAmount: original.taxAmount,
        total: original.total,
        amountPaid: 0,
        notes: original.notes,
        paymentTerms: original.paymentTerms,
        lateFeeNote: original.lateFeeNote,
        template: original.template,
        billingMonth: original.billingMonth,
        duplicatedFrom: originalId,
      })
      .returning()
      .get();

    // Copy line items
    const originalItems = db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, originalId))
      .orderBy(invoiceLineItems.sortOrder)
      .all();

    for (const item of originalItems) {
      db.insert(invoiceLineItems)
        .values({
          invoiceId: newInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitLabel: item.unitLabel,
          amount: item.amount,
          sortOrder: item.sortOrder,
          sessionId: null, // Don't link sessions to duplicate
        })
        .run();
    }

    const newLineItems = db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, newInvoice.id))
      .all();

    return NextResponse.json(
      { ...newInvoice, lineItems: newLineItems },
      { status: 201 }
    );
  } catch (error) {
    console.error("Duplicate invoice error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate invoice" },
      { status: 500 }
    );
  }
}
