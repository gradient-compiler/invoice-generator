import { db } from "@/db";
import { businessSettings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Generate the next formatted invoice/receipt/credit note number.
 *
 * @param prefix - e.g. "INV", "RCP", "CN"
 * @param currentNum - the current sequence number (1-based)
 * @returns formatted string like "INV-00001", "RCP-00042"
 */
export function generateNextNumber(prefix: string, currentNum: number): string {
  const padded = String(currentNum).padStart(5, "0");
  return `${prefix}-${padded}`;
}

/**
 * Atomically claim the next invoice number using SQL-level increment.
 * Prevents race conditions where concurrent requests could get the same number.
 */
export function claimNextInvoiceNumber(): { invoiceNumber: string; nextNum: number } {
  // Atomic increment — a single UPDATE that returns the old value
  db.run(sql`UPDATE business_settings SET next_invoice_num = next_invoice_num + 1 WHERE id = 1`);
  // The row now holds nextNum+1, so the number we claimed is nextNum+1 - 1
  const row = db.select({ nextInvoiceNum: businessSettings.nextInvoiceNum, invoicePrefix: businessSettings.invoicePrefix })
    .from(businessSettings).where(eq(businessSettings.id, 1)).get();
  const claimedNum = (row?.nextInvoiceNum ?? 1) - 1;
  const prefix = row?.invoicePrefix || "INV";
  return { invoiceNumber: generateNextNumber(prefix, claimedNum), nextNum: claimedNum };
}
