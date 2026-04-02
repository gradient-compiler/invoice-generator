import { NextResponse } from "next/server";
import { db } from "@/db";
import { businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { safeEncrypt, safeDecrypt } from "@/lib/crypto";

const ENCRYPTED_FIELDS = ["smtpPass", "bankAccount", "bankHolder", "paynowNumber", "gstNumber"] as const;

const SETTINGS_UPDATABLE_FIELDS = new Set([
  "businessName", "address", "phone", "email", "logoPath",
  "gstRegistered", "gstNumber", "defaultCurrency",
  "invoicePrefix", "receiptPrefix", "creditNotePrefix",
  "bankName", "bankAccount", "bankHolder", "paynowNumber",
  "defaultTemplate", "defaultPaymentTerms", "latePaymentNote",
  "smtpHost", "smtpPort", "smtpUser", "smtpPass",
  "smtpFromName", "smtpFromEmail", "smtpSecure",
]);

function pickAllowed<T extends Record<string, unknown>>(obj: T, allowed: Set<string>): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (allowed.has(key)) result[key] = obj[key];
  }
  return result as Partial<T>;
}

function decryptSettings(settings: Record<string, unknown>): Record<string, unknown> {
  const result = { ...settings };
  for (const field of ENCRYPTED_FIELDS) {
    if (result[field] && typeof result[field] === "string") {
      result[field] = safeDecrypt(result[field] as string);
    }
  }
  // Never expose the admin password hash to the client
  delete result.adminPasswordHash;
  return result;
}

function encryptSettingsFields(body: Record<string, unknown>): Record<string, unknown> {
  const result = { ...body };
  for (const field of ENCRYPTED_FIELDS) {
    if (result[field] && typeof result[field] === "string") {
      result[field] = safeEncrypt(result[field] as string);
    }
  }
  // Prevent overwriting auth fields via settings API
  delete result.adminPasswordHash;
  return result;
}

export async function GET(request: Request) {
  try {
    ensureDbInitialized();
    const authError = requireAuth(request);
    if (authError) return authError;

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

    return NextResponse.json(decryptSettings(settings as unknown as Record<string, unknown>));
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
    const authError = requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const filteredBody = pickAllowed(body, SETTINGS_UPDATABLE_FIELDS);
    const encryptedBody = encryptSettingsFields(filteredBody);

    const existing = db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    if (!existing) {
      const result = db
        .insert(businessSettings)
        .values({ ...encryptedBody, id: 1 } as typeof businessSettings.$inferInsert)
        .returning()
        .get();
      logAudit({ action: "settings_update", entityType: "settings", request });
      return NextResponse.json(decryptSettings(result as unknown as Record<string, unknown>));
    }

    const result = db
      .update(businessSettings)
      .set({
        ...encryptedBody,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businessSettings.id, 1))
      .returning()
      .get();

    logAudit({ action: "settings_update", entityType: "settings", request });
    return NextResponse.json(decryptSettings(result as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
