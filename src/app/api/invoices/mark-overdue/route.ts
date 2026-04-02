import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();

    const result = db
      .update(invoices)
      .set({
        status: "overdue",
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(invoices.status, "sent"),
          sql`${invoices.dueDate} < date('now')`
        )
      )
      .run();

    return NextResponse.json({ updated: result.changes });
  } catch (error) {
    console.error("Mark overdue error:", error);
    return NextResponse.json(
      { error: "Failed to mark overdue invoices" },
      { status: 500 }
    );
  }
}
