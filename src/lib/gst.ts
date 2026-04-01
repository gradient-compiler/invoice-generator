/** Singapore GST rate (9%) */
export const GST_RATE = 0.09;

/**
 * Calculate the GST amount on a subtotal.
 *
 * @param subtotal - pre-tax amount
 * @param rate - GST rate as a decimal, defaults to 0.09
 * @returns the GST amount rounded to 2 decimal places
 */
export function calculateGST(subtotal: number, rate: number = GST_RATE): number {
  return Math.round(subtotal * rate * 100) / 100;
}

/**
 * Calculate the total inclusive of GST.
 *
 * @param subtotal - pre-tax amount
 * @param rate - GST rate as a decimal, defaults to 0.09
 * @returns subtotal + GST, rounded to 2 decimal places
 */
export function calculateTotalWithGST(
  subtotal: number,
  rate: number = GST_RATE
): number {
  const gst = calculateGST(subtotal, rate);
  return Math.round((subtotal + gst) * 100) / 100;
}
