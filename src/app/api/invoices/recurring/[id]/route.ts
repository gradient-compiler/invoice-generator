import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { recurringInvoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;

    const row = db
      .select()
      .from(recurringInvoices)
      .where(eq(recurringInvoices.id, parseInt(id)))
      .get();

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("Get recurring invoice error:", error);
    return NextResponse.json({ error: "Failed to get recurring invoice" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;

    const recurringSchema = z.object({
      clientId: z.number().int().positive(),
      frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]).default("monthly"),
      lineItemsJson: z.string().min(1, "Line items required"),
      currency: z.string().default("SGD"),
      discountType: z.enum(["percentage", "fixed"]).optional().nullable(),
      discountValue: z.number().min(0).default(0),
      discountLabel: z.string().optional().nullable(),
      paymentTerms: z.string().default("Due upon receipt"),
      template: z.string().default("clean-professional"),
      notes: z.string().optional().nullable(),
      nextGenerateDate: z.string().min(1, "Next generate date required"),
    });
    const updateSchema = recurringSchema.partial();

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(recurringInvoices)
      .where(eq(recurringInvoices.id, parseInt(id)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (parsed.data.clientId !== undefined) updateData.clientId = parsed.data.clientId;
    if (parsed.data.frequency !== undefined) updateData.frequency = parsed.data.frequency;
    if (parsed.data.lineItemsJson !== undefined) updateData.lineItemsJson = parsed.data.lineItemsJson;
    if (parsed.data.currency !== undefined) updateData.currency = parsed.data.currency;
    if (parsed.data.discountType !== undefined) updateData.discountType = parsed.data.discountType;
    if (parsed.data.discountValue !== undefined) updateData.discountValue = parsed.data.discountValue;
    if (parsed.data.discountLabel !== undefined) updateData.discountLabel = parsed.data.discountLabel;
    if (parsed.data.paymentTerms !== undefined) updateData.paymentTerms = parsed.data.paymentTerms;
    if (parsed.data.template !== undefined) updateData.template = parsed.data.template;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
    if (parsed.data.nextGenerateDate !== undefined) updateData.nextGenerateDate = parsed.data.nextGenerateDate;

    const result = db
      .update(recurringInvoices)
      .set(updateData)
      .where(eq(recurringInvoices.id, parseInt(id)))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update recurring invoice error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;

    const toggleSchema = z.object({ isActive: z.boolean() });
    const body = await request.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(recurringInvoices)
      .where(eq(recurringInvoices.id, parseInt(id)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = db
      .update(recurringInvoices)
      .set({
        isActive: parsed.data.isActive,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(recurringInvoices.id, parseInt(id)))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Toggle recurring invoice error:", error);
    return NextResponse.json({ error: "Failed to toggle" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;

    db.delete(recurringInvoices)
      .where(eq(recurringInvoices.id, parseInt(id)))
      .run();

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete recurring invoice error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
