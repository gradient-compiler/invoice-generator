import { db } from "@/db";
import { creditNotes, businessSettings, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateNextNumber } from "./invoice-number";

interface CreateCreditNoteParams {
  clientId: number;
  amount: number;
  reason: string;
  originalInvoiceId?: number;
  sessionId?: number;
}

export function createCreditNote(params: CreateCreditNoteParams) {
  const settings = db
    .select()
    .from(businessSettings)
    .where(eq(businessSettings.id, 1))
    .get();

  if (!settings) throw new Error("Business settings not configured");

  const creditNumber = generateNextNumber(
    settings.creditNotePrefix || "CN",
    settings.nextCreditNoteNum || 1
  );

  const result = db
    .insert(creditNotes)
    .values({
      creditNumber,
      clientId: params.clientId,
      originalInvoiceId: params.originalInvoiceId || null,
      amount: params.amount,
      reason: params.reason,
      status: "pending",
    })
    .run();

  // Update next credit note number
  db.update(businessSettings)
    .set({ nextCreditNoteNum: (settings.nextCreditNoteNum || 1) + 1 })
    .where(eq(businessSettings.id, 1))
    .run();

  const creditNoteId = Number(result.lastInsertRowid);

  // Link session to credit note if provided
  if (params.sessionId) {
    db.update(sessions)
      .set({ creditNoteId })
      .where(eq(sessions.id, params.sessionId))
      .run();
  }

  return { id: creditNoteId, creditNumber };
}
