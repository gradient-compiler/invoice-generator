import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  businessSettings,
  clients,
  rateTiers,
  terms,
  sessions,
  invoices,
  invoiceLineItems,
  creditNotes,
  receipts,
  invoiceTemplates,
} from "@/db/schema";

// Select types (what you get from the DB)
export type BusinessSettings = InferSelectModel<typeof businessSettings>;
export type Client = InferSelectModel<typeof clients>;
export type RateTier = InferSelectModel<typeof rateTiers>;
export type Term = InferSelectModel<typeof terms>;
export type Session = InferSelectModel<typeof sessions>;
export type Invoice = InferSelectModel<typeof invoices>;
export type InvoiceLineItem = InferSelectModel<typeof invoiceLineItems>;
export type CreditNote = InferSelectModel<typeof creditNotes>;
export type Receipt = InferSelectModel<typeof receipts>;
export type InvoiceTemplate = InferSelectModel<typeof invoiceTemplates>;

// Insert types (what you send to the DB)
export type NewClient = InferInsertModel<typeof clients>;
export type NewRateTier = InferInsertModel<typeof rateTiers>;
export type NewTerm = InferInsertModel<typeof terms>;
export type NewSession = InferInsertModel<typeof sessions>;
export type NewInvoice = InferInsertModel<typeof invoices>;
export type NewInvoiceLineItem = InferInsertModel<typeof invoiceLineItems>;
export type NewCreditNote = InferInsertModel<typeof creditNotes>;
export type NewReceipt = InferInsertModel<typeof receipts>;

// Extended types for UI
export type InvoiceWithItems = Invoice & {
  lineItems: InvoiceLineItem[];
  client: Client;
};

export type SessionWithClient = Session & {
  client: Client;
  rateTier: RateTier | null;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type SessionStatus = "completed" | "cancelled" | "no_show";
export type MissedClassHandling = "deduct" | "credit_forward";
export type ClientType = "tuition" | "freelance" | "retail" | "service";
export type RateType = "hourly" | "fixed" | "per_session" | "per_unit";
export type DiscountType = "percentage" | "fixed";
export type PaymentMethod = "PayNow" | "Bank Transfer" | "Cash";
export type CreditNoteStatus = "pending" | "applied" | "expired";

export type GradeLevel =
  | "P1" | "P2" | "P3" | "P4" | "P5" | "P6"
  | "S1" | "S2" | "S3" | "S4";

export const GRADE_LEVELS: GradeLevel[] = [
  "P1", "P2", "P3", "P4", "P5", "P6",
  "S1", "S2", "S3", "S4",
];

// PDF data contract
export interface InvoicePDFData {
  businessName: string;
  businessAddress: string;
  businessPhone?: string;
  businessEmail?: string;
  logoPath?: string;
  gstNumber?: string;

  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;

  clientName: string;
  clientParentName?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;

  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    unitLabel: string;
    amount: number;
  }>;

  subtotal: number;
  discountLabel?: string;
  discountAmount: number;
  taxLabel?: string;
  taxAmount: number;
  total: number;
  currency: string;

  paymentTerms: string;
  lateFeeNote?: string;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  paynowQrDataUri?: string;

  notes?: string;
}

export interface ReceiptPDFData {
  businessName: string;
  businessAddress: string;
  businessPhone?: string;
  businessEmail?: string;
  logoPath?: string;

  receiptNumber: string;
  invoiceNumber: string;
  paymentDate: string;
  paymentMethod: string;
  amount: number;
  currency: string;

  clientName: string;
  clientParentName?: string;

  notes?: string;
}
