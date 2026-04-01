export interface InvoicePreset {
  slug: string;
  name: string;
  description: string;
  defaults: {
    unitLabel: string;
    paymentTerms: string;
    currency: string;
    enableSessionLogging: boolean;
    lineItemGrouping: "grouped" | "detailed";
    showCancelledSessions?: boolean;
    defaultDuration?: number;
    durationStep?: number;
  };
}

export const INVOICE_PRESETS: InvoicePreset[] = [
  {
    slug: "english-tuition",
    name: "English Tuition",
    description:
      "Monthly invoicing for English tuition classes with grade-based rates",
    defaults: {
      unitLabel: "hr",
      paymentTerms: "Due upon receipt",
      currency: "SGD",
      enableSessionLogging: true,
      lineItemGrouping: "grouped",
      showCancelledSessions: false,
      defaultDuration: 1.5,
      durationStep: 0.5,
    },
  },
  {
    slug: "freelancer",
    name: "Freelancer / Consultant",
    description: "Hourly or project-based billing for freelance work",
    defaults: {
      unitLabel: "hr",
      paymentTerms: "Net 14",
      currency: "SGD",
      enableSessionLogging: true,
      lineItemGrouping: "detailed",
      defaultDuration: 1.0,
      durationStep: 0.25,
    },
  },
  {
    slug: "retail",
    name: "Product Sales",
    description: "Invoice for physical product sales with quantity and pricing",
    defaults: {
      unitLabel: "unit",
      paymentTerms: "Due upon receipt",
      currency: "SGD",
      enableSessionLogging: false,
      lineItemGrouping: "detailed",
    },
  },
  {
    slug: "service",
    name: "Service Provider",
    description: "Fixed-fee service invoicing for professional services",
    defaults: {
      unitLabel: "lot",
      paymentTerms: "Net 30",
      currency: "SGD",
      enableSessionLogging: false,
      lineItemGrouping: "detailed",
    },
  },
  {
    slug: "jewelry",
    name: "Artisan Jewelry",
    description: "Invoice for handcrafted jewelry pieces and collections",
    defaults: {
      unitLabel: "item",
      paymentTerms: "Due upon receipt",
      currency: "SGD",
      enableSessionLogging: false,
      lineItemGrouping: "detailed",
    },
  },
  {
    slug: "clay-classes",
    name: "Clay Art Classes",
    description:
      "Session-based invoicing for pottery and clay art workshops",
    defaults: {
      unitLabel: "session",
      paymentTerms: "Due upon receipt",
      currency: "SGD",
      enableSessionLogging: true,
      lineItemGrouping: "grouped",
      defaultDuration: 2.0,
      durationStep: 0.5,
    },
  },
  {
    slug: "handcrafted",
    name: "Handcrafted Products",
    description:
      "Invoice for handmade clay art, crafts, and artisan products",
    defaults: {
      unitLabel: "item",
      paymentTerms: "Due upon receipt",
      currency: "SGD",
      enableSessionLogging: false,
      lineItemGrouping: "detailed",
    },
  },
];
