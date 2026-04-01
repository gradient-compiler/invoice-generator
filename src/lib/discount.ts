export interface DiscountResult {
  discountAmount: number;
  discountedTotal: number;
}

/**
 * Apply a discount to a subtotal.
 *
 * @param subtotal - the original amount before discount
 * @param type - "percentage" (e.g. 10 for 10%) or "fixed" (dollar amount)
 * @param value - the discount value
 * @returns the computed discount amount and the resulting total
 */
export function applyDiscount(
  subtotal: number,
  type: "percentage" | "fixed",
  value: number
): DiscountResult {
  let discountAmount: number;

  if (type === "percentage") {
    discountAmount = Math.round(subtotal * (value / 100) * 100) / 100;
  } else {
    discountAmount = Math.round(value * 100) / 100;
  }

  // Clamp: discount cannot exceed subtotal
  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  // Ensure non-negative
  if (discountAmount < 0) {
    discountAmount = 0;
  }

  const discountedTotal = Math.round((subtotal - discountAmount) * 100) / 100;

  return { discountAmount, discountedTotal };
}
