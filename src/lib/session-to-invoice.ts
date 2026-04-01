import { db } from "@/db";
import {
  sessions,
  clients,
  rateTiers,
  invoices,
  invoiceLineItems,
  businessSettings,
  creditNotes,
} from "@/db/schema";
import { eq, and, isNull, like, sql } from "drizzle-orm";
import { generateNextNumber } from "./invoice-number";
import { calculateGST } from "./gst";

interface GenerateMonthlyParams {
  month: string; // "YYYY-MM"
  clientIds?: number[];
  lineItemGrouping?: "grouped" | "detailed";
}

interface GeneratedInvoice {
  id: number;
  invoiceNumber: string;
  clientId: number;
  clientName: string;
  total: number;
  lineItemCount: number;
}

export async function generateMonthlyInvoices(
  params: GenerateMonthlyParams
): Promise<GeneratedInvoice[]> {
  const { month, clientIds, lineItemGrouping = "grouped" } = params;

  // Get business settings
  const settings = db
    .select()
    .from(businessSettings)
    .where(eq(businessSettings.id, 1))
    .get();

  if (!settings) throw new Error("Business settings not configured");

  // Get all uninvoiced completed sessions for the month
  const monthPattern = `${month}%`;
  let sessionQuery = db
    .select({
      session: sessions,
      client: clients,
      rateTier: rateTiers,
    })
    .from(sessions)
    .innerJoin(clients, eq(sessions.clientId, clients.id))
    .leftJoin(rateTiers, eq(sessions.rateTierId, rateTiers.id))
    .where(
      and(
        like(sessions.sessionDate, monthPattern),
        eq(sessions.status, "completed"),
        isNull(sessions.invoiceId)
      )
    )
    .all();

  // Filter by clientIds if provided
  if (clientIds && clientIds.length > 0) {
    sessionQuery = sessionQuery.filter((s) =>
      clientIds.includes(s.session.clientId)
    );
  }

  // Group sessions by client
  const clientSessions = new Map<
    number,
    {
      client: typeof sessionQuery[0]["client"];
      sessions: typeof sessionQuery;
    }
  >();

  for (const row of sessionQuery) {
    const cid = row.session.clientId;
    if (!clientSessions.has(cid)) {
      clientSessions.set(cid, { client: row.client, sessions: [] });
    }
    clientSessions.get(cid)!.sessions.push(row);
  }

  const results: GeneratedInvoice[] = [];
  let nextNum = settings.nextInvoiceNum || 1;

  for (const [clientId, data] of clientSessions) {
    const { client, sessions: clientSessionRows } = data;

    if (clientSessionRows.length === 0) continue;

    // Check for existing invoice for this client+month
    const existing = db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.clientId, clientId),
          eq(invoices.billingMonth, month)
        )
      )
      .get();

    if (existing) continue; // Already has an invoice for this month

    // Build line items
    const lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      unitLabel: string;
      amount: number;
      sessionId: number | null;
    }> = [];

    if (lineItemGrouping === "grouped") {
      // Group by rate tier
      const rateGroups = new Map<
        string,
        {
          tierName: string;
          rate: number;
          totalHours: number;
          sessionCount: number;
          sessionIds: number[];
        }
      >();

      for (const row of clientSessionRows) {
        const rate =
          row.session.rateOverride || row.rateTier?.rate || 0;
        const tierName = row.rateTier?.name || "Custom";
        const key = `${tierName}-${rate}`;

        if (!rateGroups.has(key)) {
          rateGroups.set(key, {
            tierName,
            rate,
            totalHours: 0,
            sessionCount: 0,
            sessionIds: [],
          });
        }

        const group = rateGroups.get(key)!;
        group.totalHours += row.session.durationHours;
        group.sessionCount += 1;
        group.sessionIds.push(row.session.id);
      }

      for (const [, group] of rateGroups) {
        lineItems.push({
          description: `English Tuition (${group.tierName}) - ${group.sessionCount} sessions x ${(group.totalHours / group.sessionCount).toFixed(1)} hrs`,
          quantity: group.totalHours,
          unitPrice: group.rate,
          unitLabel: "hr",
          amount: round2(group.totalHours * group.rate),
          sessionId: null,
        });
      }
    } else {
      // Detailed: one line per session
      for (const row of clientSessionRows) {
        const rate =
          row.session.rateOverride || row.rateTier?.rate || 0;
        const tierName = row.rateTier?.name || "Custom";
        const dateStr = row.session.sessionDate;

        lineItems.push({
          description: `${dateStr} - English Tuition (${tierName}) - ${row.session.durationHours} hrs`,
          quantity: row.session.durationHours,
          unitPrice: rate,
          unitLabel: "hr",
          amount: round2(row.session.durationHours * rate),
          sessionId: row.session.id,
        });
      }
    }

    // Calculate totals
    const subtotal = round2(
      lineItems.reduce((sum, item) => sum + item.amount, 0)
    );

    // Check for pending credit notes for this client
    const pendingCredits = db
      .select()
      .from(creditNotes)
      .where(
        and(
          eq(creditNotes.clientId, clientId),
          eq(creditNotes.status, "pending")
        )
      )
      .all();

    let creditAmount = 0;
    const appliedCreditIds: number[] = [];
    for (const cn of pendingCredits) {
      creditAmount += cn.amount;
      appliedCreditIds.push(cn.id);
    }

    const afterDiscount = round2(Math.max(0, subtotal - creditAmount));
    const discountAmount = round2(Math.min(creditAmount, subtotal));

    // Calculate GST if applicable
    const taxRate = settings.gstRegistered ? 0.09 : 0;
    const taxAmount = taxRate > 0 ? calculateGST(afterDiscount, taxRate) : 0;
    const total = round2(afterDiscount + taxAmount);

    // Generate invoice number
    const invoiceNumber = generateNextNumber(
      settings.invoicePrefix || "INV",
      nextNum
    );
    nextNum += 1;

    // Create invoice
    const result = db
      .insert(invoices)
      .values({
        invoiceNumber,
        clientId,
        status: "draft",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
        currency: settings.defaultCurrency || "SGD",
        subtotal,
        discountAmount: discountAmount > 0 ? discountAmount : 0,
        discountType: discountAmount > 0 ? "fixed" : null,
        discountValue: discountAmount > 0 ? discountAmount : 0,
        discountLabel:
          discountAmount > 0 ? "Credit Note Applied" : null,
        taxRate,
        taxAmount,
        total,
        amountPaid: 0,
        paymentTerms: settings.defaultPaymentTerms || "Due upon receipt",
        lateFeeNote: settings.latePaymentNote,
        template: settings.defaultTemplate || "clean-professional",
        billingMonth: month,
      })
      .run();

    const invoiceId = Number(result.lastInsertRowid);

    // Create line items
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      db.insert(invoiceLineItems)
        .values({
          invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitLabel: item.unitLabel,
          amount: item.amount,
          sortOrder: i,
          sessionId: item.sessionId,
        })
        .run();
    }

    // Link sessions to invoice
    for (const row of clientSessionRows) {
      db.update(sessions)
        .set({ invoiceId })
        .where(eq(sessions.id, row.session.id))
        .run();
    }

    // Mark credit notes as applied
    for (const cnId of appliedCreditIds) {
      db.update(creditNotes)
        .set({ status: "applied", appliedToInvoiceId: invoiceId })
        .where(eq(creditNotes.id, cnId))
        .run();
    }

    // Update next invoice number
    db.update(businessSettings)
      .set({ nextInvoiceNum: nextNum })
      .where(eq(businessSettings.id, 1))
      .run();

    results.push({
      id: invoiceId,
      invoiceNumber,
      clientId,
      clientName: client.name,
      total,
      lineItemCount: lineItems.length,
    });
  }

  return results;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
