import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceLineItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { parseId } from "@/lib/parse-id";
import { logAudit } from "@/lib/audit";
import { claimNextInvoiceNumber } from "@/lib/invoice-number";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;
    const parsed = parseId(id);
    if ("error" in parsed) return parsed.error;
    const originalId = parsed.id;

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

    // Atomically claim next invoice number
    const { invoiceNumber } = claimNextInvoiceNumber();

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

    logAudit({ action: "invoice_duplicate", entityType: "invoice", entityId: newInvoice.id, detail: `Duplicated from ${originalId}`, request });
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
