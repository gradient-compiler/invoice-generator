import { z } from "zod";

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------
export const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  parentName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  gradeLevel: z.string().optional(),
  clientType: z.string().default("tuition"),
  isActive: z.coerce.boolean().default(true),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

// ---------------------------------------------------------------------------
// Rate Tier
// ---------------------------------------------------------------------------
export const rateTierSchema = z.object({
  name: z.string().min(1, "Rate tier name is required"),
  rate: z.coerce
    .number({ error: "Rate must be a positive number" })
    .positive("Rate must be positive"),
  currency: z.string().default("SGD"),
  rateType: z.enum(["hourly", "fixed", "per_session"]).default("hourly"),
  description: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
});

export type RateTierFormValues = z.infer<typeof rateTierSchema>;

// ---------------------------------------------------------------------------
// Term
// ---------------------------------------------------------------------------
export const termSchema = z
  .object({
    name: z.string().min(1, "Term name is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    year: z.coerce
      .number({ error: "Year must be a number" })
      .int()
      .min(2000)
      .max(2100),
    isActive: z.coerce.boolean().default(true),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export type TermFormValues = z.infer<typeof termSchema>;

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
export const sessionSchema = z.object({
  clientId: z.coerce.number().int().positive("Client is required"),
  sessionDate: z.string().min(1, "Session date is required"),
  durationHours: z.coerce
    .number({ error: "Duration must be a number" })
    .positive("Duration must be positive"),
  rateTierId: z.coerce.number().int().positive().optional().nullable(),
  rateOverride: z.coerce.number().positive().optional().nullable(),
  status: z
    .enum(["completed", "cancelled", "no_show", "scheduled"])
    .default("completed"),
  missedClassHandling: z
    .enum(["charge", "waive", "credit", "reschedule"])
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
});

export type SessionFormValues = z.infer<typeof sessionSchema>;

// ---------------------------------------------------------------------------
// Invoice Line Item
// ---------------------------------------------------------------------------
export const invoiceLineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce
    .number({ error: "Quantity must be a number" })
    .positive("Quantity must be positive"),
  unitPrice: z.coerce
    .number({ error: "Unit price must be a number" })
    .min(0, "Unit price cannot be negative"),
  unitLabel: z.string().default("hr"),
  sortOrder: z.coerce.number().int().default(0),
  sessionId: z.coerce.number().int().positive().optional().nullable(),
});

export type InvoiceLineItemFormValues = z.infer<typeof invoiceLineItemSchema>;

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------
export const invoiceSchema = z.object({
  clientId: z.coerce.number().int().positive("Client is required"),
  status: z.enum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"]).optional(),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  currency: z.string().default("SGD"),
  discountType: z.enum(["percentage", "fixed"]).optional().nullable(),
  discountValue: z.coerce.number().min(0).default(0),
  discountLabel: z.string().optional().nullable(),
  taxRate: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  paymentTerms: z.string().default("Due upon receipt"),
  lateFeeNote: z.string().optional().nullable(),
  template: z.string().default("clean-professional"),
  billingMonth: z.string().optional().nullable(),
  lineItems: z.array(invoiceLineItemSchema).min(1, "At least one line item is required"),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

// ---------------------------------------------------------------------------
// Receipt
// ---------------------------------------------------------------------------
export const receiptSchema = z.object({
  invoiceId: z.coerce.number().int().positive("Invoice is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z
    .enum(["paynow", "bank_transfer", "cash", "cheque", "other"])
    .optional()
    .nullable(),
  amount: z.coerce
    .number({ error: "Amount must be a number" })
    .positive("Amount must be positive"),
  notes: z.string().optional(),
});

export type ReceiptFormValues = z.infer<typeof receiptSchema>;

// ---------------------------------------------------------------------------
// Credit Note
// ---------------------------------------------------------------------------
export const creditNoteSchema = z.object({
  clientId: z.coerce.number().int().positive("Client is required"),
  originalInvoiceId: z.coerce.number().int().positive().optional().nullable(),
  amount: z.coerce
    .number({ error: "Amount must be a number" })
    .positive("Amount must be positive"),
  reason: z.string().min(1, "Reason is required"),
  appliedToInvoiceId: z.coerce.number().int().positive().optional().nullable(),
});

export type CreditNoteFormValues = z.infer<typeof creditNoteSchema>;

// ---------------------------------------------------------------------------
// Business Settings
// ---------------------------------------------------------------------------
export const businessSettingsSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  gstRegistered: z.coerce.boolean().default(false),
  gstRate: z.coerce.number().min(0).max(100).default(9),
  gstNumber: z.string().optional(),
  defaultCurrency: z.string().default("SGD"),
  invoicePrefix: z.string().min(1).default("INV"),
  receiptPrefix: z.string().min(1).default("RCP"),
  creditNotePrefix: z.string().min(1).default("CN"),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankHolder: z.string().optional(),
  paynowNumber: z.string().optional(),
  defaultTemplate: z.string().default("clean-professional"),
  defaultPaymentTerms: z.string().default("Due upon receipt"),
  latePaymentNote: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpFromName: z.string().optional(),
  smtpFromEmail: z.string().email("Invalid SMTP from email").optional().or(z.literal("")),
  smtpSecure: z.coerce.boolean().optional(),
});

export type BusinessSettingsFormValues = z.infer<typeof businessSettingsSchema>;
