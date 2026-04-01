import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, clients, rateTiers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function GET(request: Request) {
  try {
    ensureDbInitialized();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const month = searchParams.get("month");
    const status = searchParams.get("status");
    const invoiced = searchParams.get("invoiced");

    const conditions = [];

    if (clientId) {
      conditions.push(eq(sessions.clientId, parseInt(clientId)));
    }
    if (month) {
      // month format: YYYY-MM
      conditions.push(
        sql`${sessions.sessionDate} LIKE ${month + "%"}`
      );
    }
    if (status) {
      conditions.push(eq(sessions.status, status));
    }
    if (invoiced === "true") {
      conditions.push(sql`${sessions.invoiceId} IS NOT NULL`);
    } else if (invoiced === "false") {
      conditions.push(sql`${sessions.invoiceId} IS NULL`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = db
      .select({
        id: sessions.id,
        clientId: sessions.clientId,
        clientName: clients.name,
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
      .where(where)
      .orderBy(sql`${sessions.sessionDate} DESC`)
      .all();

    return NextResponse.json(result);
  } catch (error) {
    console.error("List sessions error:", error);
    return NextResponse.json(
      { error: "Failed to list sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    ensureDbInitialized();

    const body = await request.json();
    const {
      clientId,
      sessionDate,
      durationHours,
      rateTierId,
      rateOverride,
      status,
      missedClassHandling,
      notes,
    } = body;

    if (!clientId || !sessionDate || !durationHours) {
      return NextResponse.json(
        { error: "clientId, sessionDate, and durationHours are required" },
        { status: 400 }
      );
    }

    const result = db
      .insert(sessions)
      .values({
        clientId,
        sessionDate,
        durationHours,
        rateTierId: rateTierId || null,
        rateOverride: rateOverride || null,
        status: status || "completed",
        missedClassHandling: missedClassHandling || null,
        notes: notes || null,
      })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
