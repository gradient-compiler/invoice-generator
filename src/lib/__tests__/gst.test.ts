import { describe, it, expect } from "vitest";
import { calculateGST, calculateTotalWithGST, GST_RATE } from "../gst";

describe("GST_RATE", () => {
  it("is 0.09 (9%)", () => {
    expect(GST_RATE).toBe(0.09);
  });
});

describe("calculateGST", () => {
  it("calculates 9% of 100", () => {
    expect(calculateGST(100)).toBe(9);
  });

  it("rounds to 2 decimal places", () => {
    // 33.33 * 0.09 = 2.9997 → rounds to 3.00
    expect(calculateGST(33.33)).toBe(3);
  });

  it("returns 0 for zero subtotal", () => {
    expect(calculateGST(0)).toBe(0);
  });

  it("handles smallest meaningful amount", () => {
    // 0.01 * 0.09 = 0.0009 → rounds to 0.00
    expect(calculateGST(0.01)).toBe(0);
  });

  it("returns 0 when rate is 0", () => {
    expect(calculateGST(100, 0)).toBe(0);
  });

  it("uses custom rate", () => {
    expect(calculateGST(100, 0.07)).toBe(7);
  });

  it("handles large values without precision loss", () => {
    expect(calculateGST(999999.99)).toBe(90000);
  });
});

describe("calculateTotalWithGST", () => {
  it("adds 9% GST to 100", () => {
    expect(calculateTotalWithGST(100)).toBe(109);
  });

  it("rounds correctly for fractional subtotals", () => {
    const total = calculateTotalWithGST(33.33);
    // GST = 3.00, total = 36.33
    expect(total).toBe(36.33);
  });

  it("returns 0 for zero subtotal", () => {
    expect(calculateTotalWithGST(0)).toBe(0);
  });

  it("uses custom rate", () => {
    expect(calculateTotalWithGST(100, 0.07)).toBe(107);
  });
});
