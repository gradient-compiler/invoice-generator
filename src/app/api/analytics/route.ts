import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, invoices, sessions, receipts } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();

    // --- Status breakdown ---
    const statusCounts = db
      .select({
        status: invoices.status,
        count: sql<number>`count(*)`,
        total: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
      })
      .from(invoices)
      .groupBy(invoices.status)
      .all();

    const statusMap: Record<string, { count: number; total: number }> = {};
    for (const row of statusCounts) {
      statusMap[row.status!] = { count: row.count, total: row.total };
    }

    // --- Monthly revenue (last 12 months) ---
    const monthlyRevenue = db
      .select({
        month: sql<string>`strftime('%Y-%m', ${invoices.issueDate})`.as("month"),
        invoiced: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
        paid: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.total} ELSE 0 END), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(invoices)
      .where(
        sql`${invoices.issueDate} >= date('now', '-12 months')`
      )
      .groupBy(sql`strftime('%Y-%m', ${invoices.issueDate})`)
      .orderBy(sql`strftime('%Y-%m', ${invoices.issueDate})`)
      .all();

    // --- Top clients by revenue ---
    const topClients = db
      .select({
        clientId: invoices.clientId,
        clientName: clients.name,
        totalInvoiced: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
        totalPaid: sql<number>`COALESCE(SUM(${invoices.amountPaid}), 0)`,
        invoiceCount: sql<number>`count(*)`,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .groupBy(invoices.clientId)
      .orderBy(sql`SUM(${invoices.total}) DESC`)
      .limit(10)
      .all();

    // --- Invoice aging (outstanding invoices) ---
    const agingBuckets = db
      .select({
        bucket: sql<string>`CASE
          WHEN julianday('now') - julianday(${invoices.dueDate}) < 0 THEN 'not_due'
          WHEN julianday('now') - julianday(${invoices.dueDate}) <= 30 THEN '0_30'
          WHEN julianday('now') - julianday(${invoices.dueDate}) <= 60 THEN '31_60'
          WHEN julianday('now') - julianday(${invoices.dueDate}) <= 90 THEN '61_90'
          ELSE '90_plus'
        END`.as("bucket"),
        count: sql<number>`count(*)`,
        amount: sql<number>`COALESCE(SUM(${invoices.total} - ${invoices.amountPaid}), 0)`,
      })
      .from(invoices)
      .where(sql`${invoices.status} IN ('sent', 'overdue')`)
      .groupBy(sql`bucket`)
      .all();

    // --- Collection metrics ---
    const collectionStats = db
      .select({
        totalInvoiced: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
        totalCollected: sql<number>`COALESCE(SUM(${invoices.amountPaid}), 0)`,
        totalOutstanding: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} IN ('sent', 'overdue') THEN ${invoices.total} - ${invoices.amountPaid} ELSE 0 END), 0)`,
      })
      .from(invoices)
      .where(sql`${invoices.status} != 'cancelled'`)
      .get()!;

    // --- Session stats (last 6 months) ---
    const monthlySessions = db
      .select({
        month: sql<string>`strftime('%Y-%m', ${sessions.sessionDate})`.as("month"),
        count: sql<number>`count(*)`,
        hours: sql<number>`COALESCE(SUM(${sessions.durationHours}), 0)`,
      })
      .from(sessions)
      .where(sql`${sessions.sessionDate} >= date('now', '-6 months')`)
      .groupBy(sql`strftime('%Y-%m', ${sessions.sessionDate})`)
      .orderBy(sql`strftime('%Y-%m', ${sessions.sessionDate})`)
      .all();

    // --- Average days to payment ---
    const avgPaymentTime = db
      .select({
        avgDays: sql<number>`COALESCE(AVG(julianday(${receipts.paymentDate}) - julianday(${invoices.issueDate})), 0)`,
      })
      .from(receipts)
      .innerJoin(invoices, eq(receipts.invoiceId, invoices.id))
      .get()!;

    // --- This month vs last month comparison ---
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

    const thisMonthStats = db
      .select({
        invoiced: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(invoices)
      .where(sql`strftime('%Y-%m', ${invoices.issueDate}) = ${thisMonth}`)
      .get()!;

    const lastMonthStats = db
      .select({
        invoiced: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(invoices)
      .where(sql`strftime('%Y-%m', ${invoices.issueDate}) = ${lastMonth}`)
      .get()!;

    // --- Upcoming due invoices (next 14 days) ---
    const upcomingDue = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        clientName: clients.name,
        dueDate: invoices.dueDate,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(
        and(
          sql`${invoices.status} = 'sent'`,
          sql`${invoices.dueDate} >= date('now')`,
          sql`${invoices.dueDate} <= date('now', '+14 days')`
        )
      )
      .orderBy(sql`${invoices.dueDate} ASC`)
      .limit(10)
      .all();

    return NextResponse.json({
      statusBreakdown: statusMap,
      monthlyRevenue,
      topClients,
      agingBuckets,
      collectionStats,
      monthlySessions,
      avgPaymentDays: Math.round(avgPaymentTime.avgDays),
      comparison: {
        thisMonth: { ...thisMonthStats, label: thisMonth },
        lastMonth: { ...lastMonthStats, label: lastMonth },
      },
      upcomingDue,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to load analytics data" },
      { status: 500 }
    );
  }
}
