import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, clients, rateTiers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { sessionSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;

    const session = db
      .select({
        id: sessions.id,
        clientId: sessions.clientId,
        clientName: clients.name,
        clientEmail: clients.email,
        sessionDate: sessions.sessionDate,
        durationHours: sessions.durationHours,
        rateTierId: sessions.rateTierId,
        rateTierName: rateTiers.name,
        rateTierRate: rateTiers.rate,
        rateOverride: sessions.rateOverride,
        status: sessions.status,
        missedClassHandling: sessions.missedClassHandling,
        notes: sessions.notes,
        invoiceId: sessions.invoiceId,
        creditNoteId: sessions.creditNoteId,
        createdAt: sessions.createdAt,
      })
      .from(sessions)
      .leftJoin(clients, eq(sessions.clientId, clients.id))
      .leftJoin(rateTiers, eq(sessions.rateTierId, rateTiers.id))
      .where(eq(sessions.id, parseInt(id)))
      .get();

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
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
    const parsed = sessionSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(sessions)
      .where(eq(sessions.id, parseInt(id)))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const result = db
      .update(sessions)
      .set(parsed.data)
      .where(eq(sessions.id, parseInt(id)))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
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
      .from(sessions)
      .where(eq(sessions.id, parseInt(id)))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (existing.invoiceId) {
      return NextResponse.json(
        { error: "Cannot delete a session linked to an invoice. Remove it from the invoice first." },
        { status: 400 }
      );
    }

    db.delete(sessions).where(eq(sessions.id, parseInt(id))).run();

    return NextResponse.json({ message: "Session deleted" });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
