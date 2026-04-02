import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { recurringInvoices, clients } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();

    const rows = db
      .select({
        id: recurringInvoices.id,
        clientId: recurringInvoices.clientId,
        clientName: clients.name,
        frequency: recurringInvoices.frequency,
        lineItemsJson: recurringInvoices.lineItemsJson,
        currency: recurringInvoices.currency,
        discountType: recurringInvoices.discountType,
        discountValue: recurringInvoices.discountValue,
        discountLabel: recurringInvoices.discountLabel,
        paymentTerms: recurringInvoices.paymentTerms,
        template: recurringInvoices.template,
        notes: recurringInvoices.notes,
        nextGenerateDate: recurringInvoices.nextGenerateDate,
        lastGeneratedDate: recurringInvoices.lastGeneratedDate,
        lastGeneratedInvoiceId: recurringInvoices.lastGeneratedInvoiceId,
        isActive: recurringInvoices.isActive,
        createdAt: recurringInvoices.createdAt,
      })
      .from(recurringInvoices)
      .leftJoin(clients, eq(recurringInvoices.clientId, clients.id))
      .orderBy(sql`${recurringInvoices.nextGenerateDate} ASC`)
      .all();

    return NextResponse.json(rows);
  } catch (error) {
    console.error("List recurring invoices error:", error);
    return NextResponse.json({ error: "Failed to list recurring invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
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

    const body = await request.json();
    const parsed = recurringSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const result = db
      .insert(recurringInvoices)
      .values({
        clientId: parsed.data.clientId,
        frequency: parsed.data.frequency,
        lineItemsJson: parsed.data.lineItemsJson,
        currency: parsed.data.currency,
        discountType: parsed.data.discountType || null,
        discountValue: parsed.data.discountValue,
        discountLabel: parsed.data.discountLabel || null,
        paymentTerms: parsed.data.paymentTerms,
        template: parsed.data.template,
        notes: parsed.data.notes || null,
        nextGenerateDate: parsed.data.nextGenerateDate,
      })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create recurring invoice error:", error);
    return NextResponse.json({ error: "Failed to create recurring invoice" }, { status: 500 });
  }
}
