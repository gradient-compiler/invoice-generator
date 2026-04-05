import { NextResponse } from "next/server";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { parseId } from "@/lib/parse-id";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;
    const parsed = parseId(id);
    if ("error" in parsed) return parsed.error;

    const payments = db
      .select()
      .from(receipts)
      .where(eq(receipts.invoiceId, parsed.id))
      .orderBy(sql`${receipts.paymentDate} DESC`)
      .all();

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(
      { error: "Failed to get payments" },
      { status: 500 }
    );
  }
}
