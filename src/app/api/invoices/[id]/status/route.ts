import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureDbInitialized();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["draft", "sent", "paid", "overdue", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(invoices)
      .where(eq(invoices.id, parseInt(id)))
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
      .where(eq(invoices.id, parseInt(id)))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update invoice status error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice status" },
      { status: 500 }
    );
  }
}
