import { describe, it, expect } from "vitest";
import { generateNextNumber } from "../invoice-number";

describe("generateNextNumber", () => {
  it("pads to 4 digits", () => {
    expect(generateNextNumber("INV", 1)).toBe("INV-0001");
  });

  it("pads correctly for 2-digit numbers", () => {
    expect(generateNextNumber("INV", 42)).toBe("INV-0042");
  });

  it("handles max 4-digit number", () => {
    expect(generateNextNumber("INV", 9999)).toBe("INV-9999");
  });

  it("does not truncate numbers beyond 4 digits", () => {
    expect(generateNextNumber("INV", 10000)).toBe("INV-10000");
  });

  it("works with RCP prefix", () => {
    expect(generateNextNumber("RCP", 42)).toBe("RCP-0042");
  });

  it("works with CN prefix", () => {
    expect(generateNextNumber("CN", 1)).toBe("CN-0001");
  });

  it("handles empty prefix", () => {
    expect(generateNextNumber("", 1)).toBe("-0001");
  });
});
