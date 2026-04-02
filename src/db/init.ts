import { db } from "./index";
import { businessSettings, rateTiers, invoiceTemplates } from "./schema";
import { sql } from "drizzle-orm";

let initialized = false;

export function ensureDbInitialized() {
  if (initialized) return;

  // Create tables if they don't exist
  db.run(sql`CREATE TABLE IF NOT EXISTS business_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT DEFAULT '',
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    logo_path TEXT,
    gst_registered INTEGER DEFAULT 0,
    gst_number TEXT,
    default_currency TEXT DEFAULT 'SGD',
    invoice_prefix TEXT DEFAULT 'INV',
    next_invoice_num INTEGER DEFAULT 1,
    receipt_prefix TEXT DEFAULT 'RCP',
    next_receipt_num INTEGER DEFAULT 1,
    credit_note_prefix TEXT DEFAULT 'CN',
    next_credit_note_num INTEGER DEFAULT 1,
    bank_name TEXT,
    bank_account TEXT,
    bank_holder TEXT,
    paynow_number TEXT,
    default_template TEXT DEFAULT 'clean-professional',
    default_payment_terms TEXT DEFAULT 'Due upon receipt',
    late_payment_note TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    grade_level TEXT,
    client_type TEXT DEFAULT 'tuition',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS rate_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rate REAL NOT NULL,
    currency TEXT DEFAULT 'SGD',
    rate_type TEXT DEFAULT 'hourly',
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS terms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    year INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL UNIQUE,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    status TEXT DEFAULT 'draft',
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    currency TEXT DEFAULT 'SGD',
    subtotal REAL NOT NULL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    discount_type TEXT,
    discount_value REAL DEFAULT 0,
    discount_label TEXT,
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    amount_paid REAL DEFAULT 0,
    notes TEXT,
    payment_terms TEXT DEFAULT 'Due upon receipt',
    late_fee_note TEXT,
    template TEXT DEFAULT 'clean-professional',
    billing_month TEXT,
    duplicated_from INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    session_date TEXT NOT NULL,
    duration_hours REAL NOT NULL,
    rate_tier_id INTEGER REFERENCES rate_tiers(id),
    rate_override REAL,
    status TEXT DEFAULT 'completed',
    missed_class_handling TEXT,
    notes TEXT,
    invoice_id INTEGER,
    credit_note_id INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS invoice_line_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    unit_label TEXT DEFAULT 'hr',
    amount REAL NOT NULL,
    sort_order INTEGER DEFAULT 0,
    session_id INTEGER REFERENCES sessions(id),
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS credit_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credit_number TEXT NOT NULL UNIQUE,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    original_invoice_id INTEGER REFERENCES invoices(id),
    amount REAL NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    applied_to_invoice_id INTEGER REFERENCES invoices(id),
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_number TEXT NOT NULL UNIQUE,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    payment_date TEXT NOT NULL,
    payment_method TEXT,
    amount REAL NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS invoice_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_builtin INTEGER DEFAULT 1,
    config_json TEXT
  )`);

  // Seed default data
  const settings = db.select().from(businessSettings).all();
  if (settings.length === 0) {
    db.insert(businessSettings).values({
      businessName: "",
      defaultCurrency: "SGD",
      invoicePrefix: "INV",
      receiptPrefix: "RCP",
      creditNotePrefix: "CN",
      defaultPaymentTerms: "Due upon receipt",
      defaultTemplate: "clean-professional",
    }).run();
  }

  const rates = db.select().from(rateTiers).all();
  if (rates.length === 0) {
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
      db.insert(rateTiers).values({
        name: tier.name,
        rate: tier.rate,
        currency: "SGD",
        rateType: "hourly",
        description: tier.description,
        isActive: true,
      }).run();
    }
  }

  const builtinTemplates = [
    { slug: "clean-professional", name: "Clean Professional", description: "Modern minimalist design with generous whitespace and a deep blue accent" },
    { slug: "classic", name: "Classic", description: "Traditional bordered layout with centered header and dark accents" },
    { slug: "modern-minimal", name: "Modern Minimal", description: "Ultra-clean design with no borders, bold invoice number, and subtle separators" },
    { slug: "corporate", name: "Corporate", description: "Formal layout with gray header band, structured grid, and professional sans-serif typography" },
    { slug: "creative", name: "Creative", description: "Colorful accent stripe with sidebar element, bold invoice number, and modern layout" },
    { slug: "compact-detailed", name: "Compact + Receipt", description: "Space-efficient layout with a tear-off payment slip section at the bottom" },
  ];
  const existingTemplates = db.select().from(invoiceTemplates).all();
  const existingSlugs = new Set(existingTemplates.map((t) => t.slug));
  for (const tpl of builtinTemplates) {
    if (!existingSlugs.has(tpl.slug)) {
      db.insert(invoiceTemplates).values({ ...tpl, isBuiltin: true }).run();
    }
  }

  initialized = true;
}
