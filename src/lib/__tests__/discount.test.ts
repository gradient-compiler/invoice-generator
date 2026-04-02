import { describe, it, expect } from "vitest";
import { applyDiscount } from "../discount";

describe("applyDiscount", () => {
  describe("percentage discount", () => {
    it("calculates 10% of 200", () => {
      const result = applyDiscount(200, "percentage", 10);
      expect(result).toEqual({ discountAmount: 20, discountedTotal: 180 });
    });

    it("calculates 50% of 100", () => {
      const result = applyDiscount(100, "percentage", 50);
      expect(result).toEqual({ discountAmount: 50, discountedTotal: 50 });
    });

    it("calculates 100% discount", () => {
      const result = applyDiscount(100, "percentage", 100);
      expect(result).toEqual({ discountAmount: 100, discountedTotal: 0 });
    });

    it("calculates 0% discount", () => {
      const result = applyDiscount(100, "percentage", 0);
      expect(result).toEqual({ discountAmount: 0, discountedTotal: 100 });
    });

    it("rounds to 2 decimal places", () => {
      // 33.33 * (33.33 / 100) = 11.108889 → 11.11
      const result = applyDiscount(33.33, "percentage", 33.33);
      expect(result.discountAmount).toBe(11.11);
      expect(result.discountedTotal).toBe(22.22);
    });

    it("clamps percentage > 100 to subtotal", () => {
      const result = applyDiscount(100, "percentage", 150);
      expect(result).toEqual({ discountAmount: 100, discountedTotal: 0 });
    });
  });

  describe("fixed discount", () => {
    it("applies fixed discount of 50 on 200", () => {
      const result = applyDiscount(200, "fixed", 50);
      expect(result).toEqual({ discountAmount: 50, discountedTotal: 150 });
    });

    it("clamps fixed discount exceeding subtotal", () => {
      const result = applyDiscount(100, "fixed", 150);
      expect(result).toEqual({ discountAmount: 100, discountedTotal: 0 });
    });

    it("rounds fixed discount to 2 decimal places", () => {
      const result = applyDiscount(100, "fixed", 33.335);
      expect(result.discountAmount).toBe(33.34);
    });
  });

  describe("edge cases", () => {
    it("clamps negative discount value to 0", () => {
      const result = applyDiscount(100, "percentage", -10);
      expect(result).toEqual({ discountAmount: 0, discountedTotal: 100 });
    });

    it("handles zero subtotal", () => {
      const result = applyDiscount(0, "percentage", 50);
      expect(result).toEqual({ discountAmount: 0, discountedTotal: 0 });
    });
  });
});
