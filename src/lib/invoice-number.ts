/**
 * Generate the next formatted invoice/receipt/credit note number.
 *
 * @param prefix - e.g. "INV", "RCP", "CN"
 * @param currentNum - the current sequence number (1-based)
 * @returns formatted string like "INV-0001", "RCP-0042"
 */
export function generateNextNumber(prefix: string, currentNum: number): string {
  const padded = String(currentNum).padStart(4, "0");
  return `${prefix}-${padded}`;
}
