import { db } from "@/db";
import { invoices } from "@/db/schema";
import { sql } from "drizzle-orm";
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

    const rows = db
      .select({
        Month: sql<string>`strftime('%Y-%m', ${invoices.issueDate})`,
        Invoiced: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
        Paid: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.total} ELSE 0 END), 0)`,
        "Invoice Count": sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .groupBy(sql`strftime('%Y-%m', ${invoices.issueDate})`)
      .orderBy(sql`strftime('%Y-%m', ${invoices.issueDate}) DESC`)
      .all();

    const headers = ["Month", "Invoiced", "Paid", "Invoice Count"];
    const csv = buildCsv(headers, rows as Record<string, unknown>[]);
    const date = new Date().toISOString().split("T")[0];

    logAudit({ action: "export_data", entityType: "export", detail: "analytics CSV", request });
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="analytics-${date}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export analytics error:", error);
    return new Response("Export failed", { status: 500 });
  }
}
