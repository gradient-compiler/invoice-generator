import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, invoices, sessions } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function GET() {
  try {
    ensureDbInitialized();

    const totalClients = db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(eq(clients.isActive, true))
      .get()!.count;

    const draftCount = db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.status, "draft"))
      .get()!.count;

    const sentCount = db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.status, "sent"))
      .get()!.count;

    const paidCount = db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.status, "paid"))
      .get()!.count;

    const overdueCount = db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.status, "overdue"))
      .get()!.count;

    const outstandingResult = db
      .select({ total: sql<number>`COALESCE(SUM(total - amount_paid), 0)` })
      .from(invoices)
      .where(
        and(
          sql`${invoices.status} IN ('sent', 'overdue')`,
        )
      )
      .get()!;

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const nextMonth = now.getMonth() === 11
      ? `${now.getFullYear() + 1}-01-01`
      : `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}-01`;

    const sessionsThisMonth = db
      .select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(
        and(
          sql`${sessions.sessionDate} >= ${monthStart}`,
          sql`${sessions.sessionDate} < ${nextMonth}`
        )
      )
      .get()!.count;

    const recentInvoices = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        clientId: invoices.clientId,
        clientName: clients.name,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .orderBy(sql`${invoices.issueDate} DESC`)
      .limit(5)
      .all();

    return NextResponse.json({
      stats: {
        totalClients,
        draftInvoices: draftCount,
        sentInvoices: sentCount,
        paidInvoices: paidCount,
        overdueInvoices: overdueCount,
        totalOutstanding: outstandingResult.total,
        sessionsThisMonth,
      },
      recentInvoices,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
