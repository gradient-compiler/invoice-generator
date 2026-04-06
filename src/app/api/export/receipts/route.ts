import { db } from "@/db";
import { receipts, invoices, clients } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { buildCsv } from "@/lib/csv";
import { requireAuth } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const url = new URL(request.url);
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    const conditions = [];
    if (dateFrom) conditions.push(gte(receipts.paymentDate, dateFrom));
    if (dateTo) conditions.push(lte(receipts.paymentDate, dateTo));

    const rows = db
      .select({
        "Receipt #": receipts.receiptNumber,
        "Invoice #": invoices.invoiceNumber,
        Client: clients.name,
        "Payment Date": receipts.paymentDate,
        Method: receipts.paymentMethod,
        Amount: receipts.amount,
        Notes: receipts.notes,
      })
      .from(receipts)
      .leftJoin(invoices, eq(receipts.invoiceId, invoices.id))
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${receipts.paymentDate} DESC`)
      .all();

    const formattedRows = rows.map((r) => ({
      ...r,
      "Payment Date": formatDisplayDate(r["Payment Date"] as string),
    }));
    const headers = ["Receipt #", "Invoice #", "Client", "Payment Date", "Method", "Amount", "Notes"];
    const csv = buildCsv(headers, formattedRows as Record<string, unknown>[]);
    const date = new Date().toISOString().split("T")[0];

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="receipts-${date}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export receipts error:", error);
    return new Response("Export failed", { status: 500 });
  }
}
