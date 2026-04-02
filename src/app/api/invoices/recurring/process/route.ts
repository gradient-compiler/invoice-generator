import { NextResponse } from "next/server";
import { db } from "@/db";
import { recurringInvoices, invoices, invoiceLineItems, businessSettings } from "@/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";

function addToDate(dateStr: string, frequency: string): string {
  const d = new Date(dateStr + "T00:00:00");
  switch (frequency) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly": {
      const day = d.getDate();
      d.setMonth(d.getMonth() + 1);
      // Handle month overflow (e.g. Jan 31 -> Feb 28)
      if (d.getDate() < day) d.setDate(0);
      break;
    }
    case "quarterly": {
      const day = d.getDate();
      d.setMonth(d.getMonth() + 3);
      if (d.getDate() < day) d.setDate(0);
      break;
    }
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().split("T")[0];
}

function getDueDate(issueDate: string, paymentTerms: string): string {
  const d = new Date(issueDate + "T00:00:00");
  if (paymentTerms === "Net 7") d.setDate(d.getDate() + 7);
  else if (paymentTerms === "Net 14") d.setDate(d.getDate() + 14);
  else if (paymentTerms === "Net 30") d.setDate(d.getDate() + 30);
  // "Due upon receipt" — same day
  return d.toISOString().split("T")[0];
}

export async function POST(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();

    const today = new Date().toISOString().split("T")[0];

    // Find all active recurring invoices due today or earlier
    const dueRecurring = db
      .select()
      .from(recurringInvoices)
      .where(
        and(
          eq(recurringInvoices.isActive, true),
          lte(recurringInvoices.nextGenerateDate, today)
        )
      )
      .all();

    if (dueRecurring.length === 0) {
      return NextResponse.json({ generated: [] });
    }

    const settings = db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    const prefix = settings?.invoicePrefix || "INV";
    let nextNum = settings?.nextInvoiceNum || 1;
    const gstRate = settings?.gstRegistered ? 9 : 0;

    const generatedIds: number[] = [];

    for (const rec of dueRecurring) {
      const lineItems: Array<{ description: string; quantity: number; unitPrice: number; unitLabel: string }> =
        JSON.parse(rec.lineItemsJson);

      const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);

      let discountAmount = 0;
      if (rec.discountType === "percentage" && rec.discountValue) {
        discountAmount = subtotal * (rec.discountValue / 100);
      } else if (rec.discountType === "fixed" && rec.discountValue) {
        discountAmount = rec.discountValue;
      }

      const afterDiscount = subtotal - discountAmount;
      const taxAmount = Math.round(afterDiscount * (gstRate / 100) * 100) / 100;
      const total = Math.round((afterDiscount + taxAmount) * 100) / 100;

      const invoiceNumber = `${prefix}-${String(nextNum).padStart(5, "0")}`;
      nextNum++;

      const issueDate = today;
      const dueDate = getDueDate(issueDate, rec.paymentTerms || "Due upon receipt");

      const newInvoice = db
        .insert(invoices)
        .values({
          invoiceNumber,
          clientId: rec.clientId,
          status: "draft",
          issueDate,
          dueDate,
          currency: rec.currency || "SGD",
          subtotal: Math.round(subtotal * 100) / 100,
          discountType: rec.discountType,
          discountValue: rec.discountValue ?? 0,
          discountLabel: rec.discountLabel,
          discountAmount: Math.round(discountAmount * 100) / 100,
          taxRate: gstRate,
          taxAmount,
          total,
          paymentTerms: rec.paymentTerms || "Due upon receipt",
          template: rec.template || "clean-professional",
          notes: rec.notes,
        })
        .returning()
        .get();

      // Insert line items
      for (let i = 0; i < lineItems.length; i++) {
        const li = lineItems[i];
        db.insert(invoiceLineItems)
          .values({
            invoiceId: newInvoice.id,
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            unitLabel: li.unitLabel || "hr",
            amount: Math.round(li.quantity * li.unitPrice * 100) / 100,
            sortOrder: i,
          })
          .run();
      }

      // Update recurring invoice
      db.update(recurringInvoices)
        .set({
          nextGenerateDate: addToDate(rec.nextGenerateDate, rec.frequency),
          lastGeneratedDate: today,
          lastGeneratedInvoiceId: newInvoice.id,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(recurringInvoices.id, rec.id))
        .run();

      generatedIds.push(newInvoice.id);
    }

    // Update next invoice number
    db.update(businessSettings)
      .set({ nextInvoiceNum: nextNum })
      .where(eq(businessSettings.id, 1))
      .run();

    return NextResponse.json({ generated: generatedIds });
  } catch (error) {
    console.error("Process recurring invoices error:", error);
    return NextResponse.json(
      { error: "Failed to process recurring invoices" },
      { status: 500 }
    );
  }
}
