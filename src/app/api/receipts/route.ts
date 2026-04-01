import { NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, invoices, clients, businessSettings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function GET() {
  try {
    ensureDbInitialized();

    const result = db
      .select({
        id: receipts.id,
        receiptNumber: receipts.receiptNumber,
        invoiceId: receipts.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        clientId: invoices.clientId,
        clientName: clients.name,
        paymentDate: receipts.paymentDate,
        paymentMethod: receipts.paymentMethod,
        amount: receipts.amount,
        notes: receipts.notes,
        createdAt: receipts.createdAt,
      })
      .from(receipts)
      .leftJoin(invoices, eq(receipts.invoiceId, invoices.id))
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .orderBy(sql`${receipts.paymentDate} DESC`)
      .all();

    return NextResponse.json(result);
  } catch (error) {
    console.error("List receipts error:", error);
    return NextResponse.json(
      { error: "Failed to list receipts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    ensureDbInitialized();

    const body = await request.json();
    const { invoiceId, paymentDate, paymentMethod, amount, notes } = body;

    if (!invoiceId || !paymentDate || !amount) {
      return NextResponse.json(
        { error: "invoiceId, paymentDate, and amount are required" },
        { status: 400 }
      );
    }

    // Verify invoice exists
    const invoice = db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .get();

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Generate receipt number
    const settings = db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    const prefix = settings?.receiptPrefix || "RCP";
    const nextNum = settings?.nextReceiptNum || 1;
    const receiptNumber = `${prefix}-${String(nextNum).padStart(5, "0")}`;

    db.update(businessSettings)
      .set({ nextReceiptNum: nextNum + 1 })
      .where(eq(businessSettings.id, 1))
      .run();

    // Create receipt
    const receipt = db
      .insert(receipts)
      .values({
        receiptNumber,
        invoiceId,
        paymentDate,
        paymentMethod: paymentMethod || null,
        amount,
        notes: notes || null,
      })
      .returning()
      .get();

    // Update invoice status to paid and set amountPaid
    db.update(invoices)
      .set({
        status: "paid",
        amountPaid: amount,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(invoices.id, invoiceId))
      .run();

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error("Create receipt error:", error);
    return NextResponse.json(
      { error: "Failed to create receipt" },
      { status: 500 }
    );
  }
}
