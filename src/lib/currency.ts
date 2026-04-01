export const SUPPORTED_CURRENCIES = [
  { code: "SGD", symbol: "$", name: "Singapore Dollar" },
  { code: "USD", symbol: "US$", name: "US Dollar" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
] as const;

type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

const symbolMap: Record<string, string> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((c) => [c.code, c.symbol])
);

/**
 * Format a monetary amount for display.
 *
 * @param amount  - the numeric value (may be negative)
 * @param currency - ISO currency code, defaults to "SGD"
 * @returns e.g. "$1,234.50", "US$1,234.50", "-RM500.00"
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode | string = "SGD"
): string {
  const rounded = Math.round(amount * 100) / 100;
  const isNegative = rounded < 0;
  const abs = Math.abs(rounded);

  const symbol = symbolMap[currency] ?? `${currency} `;

  // Format with thousand separators and 2 decimal places
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${isNegative ? "-" : ""}${symbol}${formatted}`;
}
