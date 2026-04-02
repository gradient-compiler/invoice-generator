import { NextResponse } from "next/server";
import { db } from "@/db";
import { creditNotes, clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { creditNoteSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;

    const creditNote = db
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
      .where(eq(creditNotes.id, parseInt(id)))
      .get();

    if (!creditNote) {
      return NextResponse.json(
        { error: "Credit note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(creditNote);
  } catch (error) {
    console.error("Get credit note error:", error);
    return NextResponse.json(
      { error: "Failed to get credit note" },
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
    const body = await request.json();
    const parsed = creditNoteSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(creditNotes)
      .where(eq(creditNotes.id, parseInt(id)))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Credit note not found" },
        { status: 404 }
      );
    }

    const result = db
      .update(creditNotes)
      .set(parsed.data)
      .where(eq(creditNotes.id, parseInt(id)))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update credit note error:", error);
    return NextResponse.json(
      { error: "Failed to update credit note" },
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

    const existing = db
      .select()
      .from(creditNotes)
      .where(eq(creditNotes.id, parseInt(id)))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Credit note not found" },
        { status: 404 }
      );
    }

    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "Can only delete credit notes with pending status" },
        { status: 400 }
      );
    }

    db.delete(creditNotes).where(eq(creditNotes.id, parseInt(id))).run();

    return NextResponse.json({ message: "Credit note deleted" });
  } catch (error) {
    console.error("Delete credit note error:", error);
    return NextResponse.json(
      { error: "Failed to delete credit note" },
      { status: 500 }
    );
  }
}
