import { NextResponse } from "next/server";
import { db } from "@/db";
import { receipts, invoices, clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;

    const receipt = db
      .select({
        id: receipts.id,
        receiptNumber: receipts.receiptNumber,
        invoiceId: receipts.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        clientId: invoices.clientId,
        clientName: clients.name,
        clientParentName: clients.parentName,
        paymentDate: receipts.paymentDate,
        paymentMethod: receipts.paymentMethod,
        amount: receipts.amount,
        currency: invoices.currency,
        notes: receipts.notes,
        createdAt: receipts.createdAt,
      })
      .from(receipts)
      .leftJoin(invoices, eq(receipts.invoiceId, invoices.id))
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(receipts.id, parseInt(id)))
      .get();

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Get receipt error:", error);
    return NextResponse.json(
      { error: "Failed to get receipt" },
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
    const receiptId = parseInt(id);

    const receipt = db
      .select()
      .from(receipts)
      .where(eq(receipts.id, receiptId))
      .get();

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    // Revert the invoice status back to "sent"
    db.update(invoices)
      .set({
        status: "sent",
        amountPaid: 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(invoices.id, receipt.invoiceId))
      .run();

    // Delete the receipt
    db.delete(receipts).where(eq(receipts.id, receiptId)).run();

    return NextResponse.json({ message: "Receipt deleted" });
  } catch (error) {
    console.error("Delete receipt error:", error);
    return NextResponse.json(
      { error: "Failed to delete receipt" },
      { status: 500 }
    );
  }
}
