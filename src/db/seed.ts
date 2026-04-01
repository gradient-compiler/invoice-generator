import { db } from "./index";
import { businessSettings, rateTiers, invoiceTemplates } from "./schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  // Seed business settings (single row)
  const existing = await db
    .select()
    .from(businessSettings)
    .where(eq(businessSettings.id, 1))
    .get();

  if (!existing) {
    await db.insert(businessSettings).values({
      businessName: "",
      defaultCurrency: "SGD",
      invoicePrefix: "INV",
      receiptPrefix: "RCP",
      creditNotePrefix: "CN",
      defaultPaymentTerms: "Due upon receipt",
      defaultTemplate: "clean-professional",
    });
  }

  // Seed rate tiers for tuition (P1-P6, S1-S4)
  const existingRates = await db.select().from(rateTiers).all();
  if (existingRates.length === 0) {
    const tuitionRates = [
      { name: "P1", rate: 30, description: "Primary 1 English Tuition" },
      { name: "P2", rate: 30, description: "Primary 2 English Tuition" },
      { name: "P3", rate: 35, description: "Primary 3 English Tuition" },
      { name: "P4", rate: 35, description: "Primary 4 English Tuition" },
      { name: "P5", rate: 40, description: "Primary 5 English Tuition" },
      { name: "P6", rate: 40, description: "Primary 6 English Tuition" },
      { name: "S1", rate: 45, description: "Secondary 1 English Tuition" },
      { name: "S2", rate: 45, description: "Secondary 2 English Tuition" },
      { name: "S3", rate: 50, description: "Secondary 3 English Tuition" },
      { name: "S4", rate: 50, description: "Secondary 4 English Tuition" },
    ];

    for (const tier of tuitionRates) {
      await db.insert(rateTiers).values({
        name: tier.name,
        rate: tier.rate,
        currency: "SGD",
        rateType: "hourly",
        description: tier.description,
        isActive: true,
      });
    }
  }

  // Seed invoice templates
  const existingTemplates = await db.select().from(invoiceTemplates).all();
  if (existingTemplates.length === 0) {
    const templates = [
      {
        slug: "clean-professional",
        name: "Clean Professional",
        description:
          "Modern minimalist design with generous whitespace and a deep blue accent",
        isBuiltin: true,
      },
      {
        slug: "classic",
        name: "Classic",
        description:
          "Traditional bordered layout with centered header and dark accents",
        isBuiltin: true,
      },
      {
        slug: "modern-minimal",
        name: "Modern Minimal",
        description:
          "Ultra-clean design with no borders, bold invoice number, and subtle separators",
        isBuiltin: true,
      },
    ];

    for (const tpl of templates) {
      await db.insert(invoiceTemplates).values(tpl);
    }
  }
}
