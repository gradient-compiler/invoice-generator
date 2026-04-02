import { describe, it, expect } from "vitest";
import { formatCurrency } from "../currency";

describe("formatCurrency", () => {
  it("formats SGD with $ symbol", () => {
    expect(formatCurrency(1234.5, "SGD")).toBe("$1,234.50");
  });

  it("defaults to SGD", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats USD with US$ symbol", () => {
    expect(formatCurrency(1234.5, "USD")).toBe("US$1,234.50");
  });

  it("formats MYR with RM symbol", () => {
    expect(formatCurrency(500, "MYR")).toBe("RM500.00");
  });

  it("formats negative values with leading minus", () => {
    expect(formatCurrency(-500, "SGD")).toBe("-$500.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large numbers with thousand separators", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(99.999)).toBe("$100.00");
  });

  it("falls back to currency code for unknown currencies", () => {
    expect(formatCurrency(1234.5, "EUR")).toBe("EUR 1,234.50");
  });
});
