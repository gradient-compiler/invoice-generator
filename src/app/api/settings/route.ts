import { NextResponse } from "next/server";
import { db } from "@/db";
import { businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function GET() {
  try {
    ensureDbInitialized();

    const settings = db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    if (!settings) {
      return NextResponse.json({
        id: 1,
        businessName: "",
        address: "",
        phone: "",
        email: "",
        logoPath: null,
        gstRegistered: false,
        gstNumber: null,
        defaultCurrency: "SGD",
        invoicePrefix: "INV",
        nextInvoiceNum: 1,
        receiptPrefix: "RCP",
        nextReceiptNum: 1,
        creditNotePrefix: "CN",
        nextCreditNoteNum: 1,
        bankName: null,
        bankAccount: null,
        bankHolder: null,
        paynowNumber: null,
        defaultTemplate: "clean-professional",
        defaultPaymentTerms: "Due upon receipt",
        latePaymentNote: null,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    ensureDbInitialized();

    const body = await request.json();

    const existing = db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    if (!existing) {
      const result = db
        .insert(businessSettings)
        .values({ ...body, id: 1 })
        .returning()
        .get();
      return NextResponse.json(result);
    }

    const result = db
      .update(businessSettings)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businessSettings.id, 1))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
