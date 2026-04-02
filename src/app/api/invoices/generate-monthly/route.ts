import { NextResponse } from "next/server";
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
import { eq, and, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function POST(request: Request) {
  try {
    ensureDbInitialized();

    const body = await request.json();
    const { month, clientIds, lineItemGrouping = "grouped", showSessionDates = false } = body;

    if (!month) {
      return NextResponse.json(
        { error: "month is required (format: YYYY-MM)" },
        { status: 400 }
      );
    }

    // Get settings
    const settings = db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    if (!settings) {
      return NextResponse.json(
        { error: "Business settings not configured" },
        { status: 400 }
      );
    }

    // Build conditions for uninvoiced completed sessions in the given month
    const conditions = [
      sql`${sessions.invoiceId} IS NULL`,
      eq(sessions.status, "completed"),
      sql`${sessions.sessionDate} LIKE ${month + "%"}`,
    ];

    if (clientIds && clientIds.length > 0) {
      conditions.push(
        sql`${sessions.clientId} IN (${sql.join(
          clientIds.map((cid: number) => sql`${cid}`),
          sql`, `
        )})`
      );
    }

    // Fetch all matching sessions with rate tier info
    const matchingSessions = db
      .select({
        id: sessions.id,
        clientId: sessions.clientId,
        sessionDate: sessions.sessionDate,
        durationHours: sessions.durationHours,
        rateTierId: sessions.rateTierId,
        rateOverride: sessions.rateOverride,
        rateTierName: rateTiers.name,
        rateTierRate: rateTiers.rate,
      })
      .from(sessions)
      .leftJoin(rateTiers, eq(sessions.rateTierId, rateTiers.id))
      .where(and(...conditions))
      .orderBy(sessions.sessionDate)
      .all();

    if (matchingSessions.length === 0) {
      // Look up existing invoices for the requested clients + month
      const existingConditions = [
        sql`${invoices.billingMonth} = ${month}`,
      ];
      if (clientIds && clientIds.length > 0) {
        existingConditions.push(
          sql`${invoices.clientId} IN (${sql.join(
            clientIds.map((cid: number) => sql`${cid}`),
            sql`, `
          )})`
        );
      }
      const existingInvoices = db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          clientId: invoices.clientId,
          clientName: clients.name,
          total: invoices.total,
          status: invoices.status,
        })
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id))
        .where(and(...existingConditions))
        .all();

      return NextResponse.json(
        {
          message: "No uninvoiced sessions found for the given month",
          invoices: [],
          existingInvoices,
        },
        { status: 200 }
      );
    }

    // Group sessions by client
    const sessionsByClient = new Map<number, typeof matchingSessions>();
    for (const session of matchingSessions) {
      const existing = sessionsByClient.get(session.clientId) || [];
      existing.push(session);
      sessionsByClient.set(session.clientId, existing);
    }

    const createdInvoices = [];

    for (const [clientId, clientSessions] of sessionsByClient) {
      // Get client info
      const client = db
        .select()
        .from(clients)
        .where(eq(clients.id, clientId))
        .get();

      if (!client) continue;

      // Generate invoice number atomically
      const currentSettings = db
        .select()
        .from(businessSettings)
        .where(eq(businessSettings.id, 1))
        .get()!;

      const prefix = currentSettings.invoicePrefix || "INV";
      const nextNum = currentSettings.nextInvoiceNum || 1;
      const invoiceNumber = `${prefix}-${String(nextNum).padStart(5, "0")}`;

      db.update(businessSettings)
        .set({ nextInvoiceNum: nextNum + 1 })
        .where(eq(businessSettings.id, 1))
        .run();

      // Build line items
      const lineItemsToInsert: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        unitLabel: string;
        amount: number;
        sortOrder: number;
        sessionId: number | null;
      }> = [];

      if (lineItemGrouping === "detailed") {
        // One line item per session
        clientSessions.forEach((session, index) => {
          const rate = session.rateOverride ?? session.rateTierRate ?? 0;
          const amount = session.durationHours * rate;
          const dateStr = session.sessionDate;
          const tierName = session.rateTierName || "Session";

          lineItemsToInsert.push({
            description: `${tierName} - ${dateStr} (${session.durationHours} hrs)`,
            quantity: session.durationHours,
            unitPrice: rate,
            unitLabel: "hr",
            amount,
            sortOrder: index,
            sessionId: session.id,
          });
        });
      } else {
        // Grouped: one line item per rate tier
        const groupedByTier = new Map<
          string,
          {
            tierName: string;
            rate: number;
            totalHours: number;
            sessionCount: number;
            durations: number[];
            dates: string[];
            sessionIds: number[];
          }
        >();

        for (const session of clientSessions) {
          const rate = session.rateOverride ?? session.rateTierRate ?? 0;
          const tierKey = `${session.rateTierId ?? "custom"}-${rate}`;
          const tierName = session.rateTierName || "Session";

          const group = groupedByTier.get(tierKey) || {
            tierName,
            rate,
            totalHours: 0,
            sessionCount: 0,
            durations: [] as number[],
            dates: [] as string[],
            sessionIds: [],
          };
          group.totalHours += session.durationHours;
          group.sessionCount += 1;
          group.durations.push(session.durationHours);
          group.dates.push(session.sessionDate);
          group.sessionIds.push(session.id);
          groupedByTier.set(tierKey, group);
        }

        let sortOrder = 0;
        for (const [, group] of groupedByTier) {
          const amount = group.totalHours * group.rate;
          const allSame = group.durations.every((d: number) => d === group.durations[0]);
          const sessionWord = group.sessionCount === 1 ? "session" : "sessions";

          let durationDesc: string;
          if (showSessionDates) {
            const details = group.dates.map((date, i) => {
              const d = new Date(date + "T00:00:00");
              const label = d.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
              return `${label}: ${group.durations[i]} hrs`;
            });
            durationDesc = `${group.sessionCount} ${sessionWord} (${details.join(", ")}), ${group.totalHours} hrs total`;
          } else if (allSame) {
            durationDesc = `${group.sessionCount} ${sessionWord} x ${group.durations[0]} hrs`;
          } else {
            durationDesc = `${group.sessionCount} ${sessionWord} (${group.durations.map((d: number) => `${d} hrs`).join(", ")}), ${group.totalHours} hrs total`;
          }

          lineItemsToInsert.push({
            description: `${group.tierName} - ${durationDesc} @ $${group.rate}/hr`,
            quantity: group.totalHours,
            unitPrice: group.rate,
            unitLabel: "hr",
            amount,
            sortOrder: sortOrder++,
            sessionId: null,
          });
        }
      }

      const subtotal = lineItemsToInsert.reduce(
        (sum, item) => sum + item.amount,
        0
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

      let creditDiscount = 0;
      const creditsToApply: Array<{ id: number; amount: number }> = [];

      for (const credit of pendingCredits) {
        if (creditDiscount + credit.amount <= subtotal) {
          creditDiscount += credit.amount;
          creditsToApply.push({ id: credit.id, amount: credit.amount });
        } else {
          // Partial credit application is not supported; skip
          break;
        }
      }

      const afterDiscount = subtotal - creditDiscount;

      // Apply GST if registered
      const taxRate = settings.gstRegistered ? 9 : 0;
      const taxAmount = afterDiscount * (taxRate / 100);
      const total = afterDiscount + taxAmount;

      // Set dates
      const issueDate = new Date().toISOString().split("T")[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      // Create invoice
      const invoice = db
        .insert(invoices)
        .values({
          invoiceNumber,
          clientId,
          status: "draft",
          issueDate,
          dueDate,
          currency: settings.defaultCurrency || "SGD",
          subtotal,
          discountAmount: creditDiscount,
          discountType: creditDiscount > 0 ? "fixed" : null,
          discountValue: creditDiscount,
          discountLabel: creditDiscount > 0 ? "Credit note applied" : null,
          taxRate,
          taxAmount,
          total,
          amountPaid: 0,
          notes: null,
          paymentTerms:
            settings.defaultPaymentTerms || "Due upon receipt",
          lateFeeNote: settings.latePaymentNote || null,
          template: settings.defaultTemplate || "clean-professional",
          billingMonth: month,
        })
        .returning()
        .get();

      // Insert line items
      for (const item of lineItemsToInsert) {
        db.insert(invoiceLineItems)
          .values({
            invoiceId: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitLabel: item.unitLabel,
            amount: item.amount,
            sortOrder: item.sortOrder,
            sessionId: item.sessionId,
          })
          .run();
      }

      // Link sessions to the invoice
      for (const session of clientSessions) {
        db.update(sessions)
          .set({ invoiceId: invoice.id })
          .where(eq(sessions.id, session.id))
          .run();
      }

      // Apply credit notes
      for (const credit of creditsToApply) {
        db.update(creditNotes)
          .set({
            status: "applied",
            appliedToInvoiceId: invoice.id,
          })
          .where(eq(creditNotes.id, credit.id))
          .run();
      }

      const createdLineItems = db
        .select()
        .from(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, invoice.id))
        .all();

      createdInvoices.push({
        ...invoice,
        clientName: client.name,
        lineItems: createdLineItems,
      });
    }

    return NextResponse.json(
      { invoices: createdInvoices },
      { status: 201 }
    );
  } catch (error) {
    console.error("Generate monthly invoices error:", error);
    return NextResponse.json(
      { error: "Failed to generate monthly invoices" },
      { status: 500 }
    );
  }
}
