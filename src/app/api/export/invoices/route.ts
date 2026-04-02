import { db } from "@/db";
import { invoices, clients } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { buildCsv } from "@/lib/csv";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;

    // Rate limit exports: max 10 per minute
    const rl = checkRateLimit(`export:${getClientIp(request)}`, { maxRequests: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return new Response("Too many requests", { status: 429 });
    }

    ensureDbInitialized();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const clientId = url.searchParams.get("clientId");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    const conditions = [];
    if (status) conditions.push(eq(invoices.status, status));
    if (clientId) conditions.push(eq(invoices.clientId, parseInt(clientId)));
    if (dateFrom) conditions.push(gte(invoices.issueDate, dateFrom));
    if (dateTo) conditions.push(lte(invoices.issueDate, dateTo));

    const rows = db
      .select({
        "Invoice #": invoices.invoiceNumber,
        Client: clients.name,
        Status: invoices.status,
        "Issue Date": invoices.issueDate,
        "Due Date": invoices.dueDate,
        Currency: invoices.currency,
        Subtotal: invoices.subtotal,
        Discount: invoices.discountAmount,
        Tax: invoices.taxAmount,
        Total: invoices.total,
        "Amount Paid": invoices.amountPaid,
        "Balance Due": sql<number>`${invoices.total} - COALESCE(${invoices.amountPaid}, 0)`,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${invoices.issueDate} DESC`)
      .all();

    const headers = [
      "Invoice #", "Client", "Status", "Issue Date", "Due Date",
      "Currency", "Subtotal", "Discount", "Tax", "Total", "Amount Paid", "Balance Due",
    ];
    const csv = buildCsv(headers, rows as Record<string, unknown>[]);
    const date = new Date().toISOString().split("T")[0];

    logAudit({ action: "export_data", entityType: "export", detail: "invoices CSV", request });
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="invoices-${date}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export invoices error:", error);
    return new Response("Export failed", { status: 500 });
  }
}
