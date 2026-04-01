import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const businessSettings = sqliteTable("business_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessName: text("business_name").default(""),
  address: text("address").default(""),
  phone: text("phone").default(""),
  email: text("email").default(""),
  logoPath: text("logo_path"),
  gstRegistered: integer("gst_registered", { mode: "boolean" }).default(false),
  gstNumber: text("gst_number"),
  defaultCurrency: text("default_currency").default("SGD"),
  invoicePrefix: text("invoice_prefix").default("INV"),
  nextInvoiceNum: integer("next_invoice_num").default(1),
  receiptPrefix: text("receipt_prefix").default("RCP"),
  nextReceiptNum: integer("next_receipt_num").default(1),
  creditNotePrefix: text("credit_note_prefix").default("CN"),
  nextCreditNoteNum: integer("next_credit_note_num").default(1),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  bankHolder: text("bank_holder"),
  paynowNumber: text("paynow_number"),
  defaultTemplate: text("default_template").default("clean-professional"),
  defaultPaymentTerms: text("default_payment_terms").default("Due upon receipt"),
  latePaymentNote: text("late_payment_note"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  parentName: text("parent_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  gradeLevel: text("grade_level"),
  clientType: text("client_type").default("tuition"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const rateTiers = sqliteTable("rate_tiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  rate: real("rate").notNull(),
  currency: text("currency").default("SGD"),
  rateType: text("rate_type").default("hourly"),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const terms = sqliteTable("terms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  year: integer("year").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  sessionDate: text("session_date").notNull(),
  durationHours: real("duration_hours").notNull(),
  rateTierId: integer("rate_tier_id").references(() => rateTiers.id),
  rateOverride: real("rate_override"),
  status: text("status").default("completed"),
  missedClassHandling: text("missed_class_handling"),
  notes: text("notes"),
  invoiceId: integer("invoice_id"),
  creditNoteId: integer("credit_note_id"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  status: text("status").default("draft"),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date").notNull(),
  currency: text("currency").default("SGD"),
  subtotal: real("subtotal").notNull().default(0),
  discountAmount: real("discount_amount").default(0),
  discountType: text("discount_type"),
  discountValue: real("discount_value").default(0),
  discountLabel: text("discount_label"),
  taxRate: real("tax_rate").default(0),
  taxAmount: real("tax_amount").default(0),
  total: real("total").notNull().default(0),
  amountPaid: real("amount_paid").default(0),
  notes: text("notes"),
  paymentTerms: text("payment_terms").default("Due upon receipt"),
  lateFeeNote: text("late_fee_note"),
  template: text("template").default("clean-professional"),
  billingMonth: text("billing_month"),
  duplicatedFrom: integer("duplicated_from"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const invoiceLineItems = sqliteTable("invoice_line_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  unitLabel: text("unit_label").default("hr"),
  amount: real("amount").notNull(),
  sortOrder: integer("sort_order").default(0),
  sessionId: integer("session_id").references(() => sessions.id),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const creditNotes = sqliteTable("credit_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  creditNumber: text("credit_number").notNull().unique(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  originalInvoiceId: integer("original_invoice_id").references(
    () => invoices.id
  ),
  amount: real("amount").notNull(),
  reason: text("reason"),
  status: text("status").default("pending"),
  appliedToInvoiceId: integer("applied_to_invoice_id").references(
    () => invoices.id
  ),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const receipts = sqliteTable("receipts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  receiptNumber: text("receipt_number").notNull().unique(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  paymentDate: text("payment_date").notNull(),
  paymentMethod: text("payment_method"),
  amount: real("amount").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const invoiceTemplates = sqliteTable("invoice_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isBuiltin: integer("is_builtin", { mode: "boolean" }).default(true),
  configJson: text("config_json"),
});
