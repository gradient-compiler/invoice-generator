import { NextResponse } from "next/server";
import { db } from "@/db";
import { creditNotes, clients, businessSettings } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function GET(request: Request) {
  try {
    ensureDbInitialized();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    const conditions = [];

    if (status) {
      conditions.push(eq(creditNotes.status, status));
    }
    if (clientId) {
      conditions.push(eq(creditNotes.clientId, parseInt(clientId)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = db
      .select({
        id: creditNotes.id,
        creditNumber: creditNotes.creditNumber,
        clientId: creditNotes.clientId,
        clientName: clients.name,
        originalInvoiceId: creditNotes.originalInvoiceId,
        amount: creditNotes.amount,
        reason: creditNotes.reason,
        status: creditNotes.status,
        appliedToInvoiceId: creditNotes.appliedToInvoiceId,
        createdAt: creditNotes.createdAt,
      })
      .from(creditNotes)
      .leftJoin(clients, eq(creditNotes.clientId, clients.id))
      .where(where)
      .orderBy(sql`${creditNotes.createdAt} DESC`)
      .all();

    return NextResponse.json(result);
  } catch (error) {
    console.error("List credit notes error:", error);
    return NextResponse.json(
      { error: "Failed to list credit notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    ensureDbInitialized();

    const body = await request.json();
    const { clientId, originalInvoiceId, amount, reason } = body;

    if (!clientId || !amount) {
      return NextResponse.json(
        { error: "clientId and amount are required" },
        { status: 400 }
      );
    }

    // Generate credit note number
    const settings = db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    const prefix = settings?.creditNotePrefix || "CN";
    const nextNum = settings?.nextCreditNoteNum || 1;
    const creditNumber = `${prefix}-${String(nextNum).padStart(5, "0")}`;

    db.update(businessSettings)
      .set({ nextCreditNoteNum: nextNum + 1 })
      .where(eq(businessSettings.id, 1))
      .run();

    const result = db
      .insert(creditNotes)
      .values({
        creditNumber,
        clientId,
        originalInvoiceId: originalInvoiceId || null,
        amount,
        reason: reason || null,
        status: "pending",
      })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create credit note error:", error);
    return NextResponse.json(
      { error: "Failed to create credit note" },
      { status: 500 }
    );
  }
}
