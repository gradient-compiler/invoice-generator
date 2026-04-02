import { describe, it, expect } from "vitest";
import {
  clientSchema,
  rateTierSchema,
  termSchema,
  sessionSchema,
  invoiceLineItemSchema,
  invoiceSchema,
  receiptSchema,
  creditNoteSchema,
  businessSettingsSchema,
} from "../validators";

describe("clientSchema", () => {
  it("accepts valid minimal client", () => {
    const result = clientSchema.safeParse({ name: "Alice" });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = clientSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = clientSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("allows empty email string", () => {
    const result = clientSchema.safeParse({ name: "A", email: "" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = clientSchema.safeParse({ name: "A", email: "notanemail" });
    expect(result.success).toBe(false);
  });

  it("defaults clientType to tuition", () => {
    const result = clientSchema.parse({ name: "A" });
    expect(result.clientType).toBe("tuition");
  });

  it("defaults isActive to true", () => {
    const result = clientSchema.parse({ name: "A" });
    expect(result.isActive).toBe(true);
  });
});

describe("rateTierSchema", () => {
  it("accepts valid rate tier", () => {
    const result = rateTierSchema.safeParse({ name: "Standard", rate: 50 });
    expect(result.success).toBe(true);
  });

  it("rejects zero rate", () => {
    const result = rateTierSchema.safeParse({ name: "Free", rate: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative rate", () => {
    const result = rateTierSchema.safeParse({ name: "Bad", rate: -10 });
    expect(result.success).toBe(false);
  });

  it("defaults currency to SGD", () => {
    const result = rateTierSchema.parse({ name: "Std", rate: 50 });
    expect(result.currency).toBe("SGD");
  });

  it("defaults rateType to hourly", () => {
    const result = rateTierSchema.parse({ name: "Std", rate: 50 });
    expect(result.rateType).toBe("hourly");
  });
});

describe("termSchema", () => {
  const validTerm = {
    name: "Term 1",
    startDate: "2025-01-01",
    endDate: "2025-03-31",
    year: 2025,
  };

  it("accepts valid term", () => {
    const result = termSchema.safeParse(validTerm);
    expect(result.success).toBe(true);
  });

  it("rejects endDate before startDate", () => {
    const result = termSchema.safeParse({
      ...validTerm,
      startDate: "2025-06-01",
      endDate: "2025-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects year below 2000", () => {
    const result = termSchema.safeParse({ ...validTerm, year: 1999 });
    expect(result.success).toBe(false);
  });

  it("rejects year above 2100", () => {
    const result = termSchema.safeParse({ ...validTerm, year: 2101 });
    expect(result.success).toBe(false);
  });
});

describe("sessionSchema", () => {
  const validSession = {
    clientId: 1,
    sessionDate: "2025-01-15",
    durationHours: 1.5,
  };

  it("accepts valid session", () => {
    const result = sessionSchema.safeParse(validSession);
    expect(result.success).toBe(true);
  });

  it("rejects missing clientId", () => {
    const result = sessionSchema.safeParse({
      sessionDate: "2025-01-15",
      durationHours: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero duration", () => {
    const result = sessionSchema.safeParse({ ...validSession, durationHours: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative duration", () => {
    const result = sessionSchema.safeParse({ ...validSession, durationHours: -1 });
    expect(result.success).toBe(false);
  });

  it("defaults status to completed", () => {
    const result = sessionSchema.parse(validSession);
    expect(result.status).toBe("completed");
  });
});

describe("invoiceLineItemSchema", () => {
  it("accepts valid line item", () => {
    const result = invoiceLineItemSchema.safeParse({
      description: "Tutoring session",
      quantity: 2,
      unitPrice: 50,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty description", () => {
    const result = invoiceLineItemSchema.safeParse({
      description: "",
      quantity: 1,
      unitPrice: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative unitPrice", () => {
    const result = invoiceLineItemSchema.safeParse({
      description: "X",
      quantity: 1,
      unitPrice: -5,
    });
    expect(result.success).toBe(false);
  });

  it("allows zero unitPrice", () => {
    const result = invoiceLineItemSchema.safeParse({
      description: "Free",
      quantity: 1,
      unitPrice: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("invoiceSchema", () => {
  const validInvoice = {
    clientId: 1,
    issueDate: "2025-01-01",
    dueDate: "2025-01-31",
    lineItems: [{ description: "Service", quantity: 1, unitPrice: 100 }],
  };

  it("accepts valid invoice", () => {
    const result = invoiceSchema.safeParse(validInvoice);
    expect(result.success).toBe(true);
  });

  it("rejects empty lineItems", () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, lineItems: [] });
    expect(result.success).toBe(false);
  });

  it("defaults taxRate to 0", () => {
    const result = invoiceSchema.parse(validInvoice);
    expect(result.taxRate).toBe(0);
  });

  it("defaults discountValue to 0", () => {
    const result = invoiceSchema.parse(validInvoice);
    expect(result.discountValue).toBe(0);
  });

  it("defaults template to clean-professional", () => {
    const result = invoiceSchema.parse(validInvoice);
    expect(result.template).toBe("clean-professional");
  });
});

describe("receiptSchema", () => {
  it("accepts valid receipt", () => {
    const result = receiptSchema.safeParse({
      invoiceId: 1,
      paymentDate: "2025-01-15",
      amount: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = receiptSchema.safeParse({
      invoiceId: 1,
      paymentDate: "2025-01-15",
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = receiptSchema.safeParse({
      invoiceId: 1,
      paymentDate: "2025-01-15",
      amount: -50,
    });
    expect(result.success).toBe(false);
  });
});

describe("creditNoteSchema", () => {
  it("accepts valid credit note", () => {
    const result = creditNoteSchema.safeParse({
      clientId: 1,
      amount: 50,
      reason: "Overcharged",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing reason", () => {
    const result = creditNoteSchema.safeParse({
      clientId: 1,
      amount: 50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty reason", () => {
    const result = creditNoteSchema.safeParse({
      clientId: 1,
      amount: 50,
      reason: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = creditNoteSchema.safeParse({
      clientId: 1,
      amount: 0,
      reason: "Test",
    });
    expect(result.success).toBe(false);
  });
});

describe("businessSettingsSchema", () => {
  it("accepts valid settings", () => {
    const result = businessSettingsSchema.safeParse({
      businessName: "My Tutoring",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing businessName", () => {
    const result = businessSettingsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("defaults invoicePrefix to INV", () => {
    const result = businessSettingsSchema.parse({ businessName: "Test" });
    expect(result.invoicePrefix).toBe("INV");
  });

  it("defaults receiptPrefix to RCP", () => {
    const result = businessSettingsSchema.parse({ businessName: "Test" });
    expect(result.receiptPrefix).toBe("RCP");
  });

  it("defaults creditNotePrefix to CN", () => {
    const result = businessSettingsSchema.parse({ businessName: "Test" });
    expect(result.creditNotePrefix).toBe("CN");
  });

  it("defaults currency to SGD", () => {
    const result = businessSettingsSchema.parse({ businessName: "Test" });
    expect(result.defaultCurrency).toBe("SGD");
  });
});
