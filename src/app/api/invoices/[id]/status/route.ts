import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { parseId } from "@/lib/parse-id";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled", "partially_paid"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;
    const parsedId = parseId(id);
    if ("error" in parsedId) return parsedId.error;
    const numericId = parsedId.id;

    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    const { status } = parsed.data;

    const existing = db
      .select()
      .from(invoices)
      .where(eq(invoices.id, numericId))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    // If marking as paid, set amountPaid = total
    if (status === "paid") {
      updateData.amountPaid = existing.total;
    }

    const result = db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, numericId))
      .returning()
      .get();

    logAudit({ action: "invoice_status_change", entityType: "invoice", entityId: id, detail: `${existing.status} -> ${status}`, request });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Update invoice status error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice status" },
      { status: 500 }
    );
  }
}
