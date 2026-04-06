import { describe, it, expect } from "vitest";
import { generateNextNumber } from "../invoice-number";

describe("generateNextNumber", () => {
  it("pads to 5 digits", () => {
    expect(generateNextNumber("INV", 1)).toBe("INV-00001");
  });

  it("pads correctly for 2-digit numbers", () => {
    expect(generateNextNumber("INV", 42)).toBe("INV-00042");
  });

  it("handles max 5-digit number", () => {
    expect(generateNextNumber("INV", 99999)).toBe("INV-99999");
  });

  it("does not truncate numbers beyond 5 digits", () => {
    expect(generateNextNumber("INV", 100000)).toBe("INV-100000");
  });

  it("works with RCP prefix", () => {
    expect(generateNextNumber("RCP", 42)).toBe("RCP-00042");
  });

  it("works with CN prefix", () => {
    expect(generateNextNumber("CN", 1)).toBe("CN-00001");
  });

  it("handles empty prefix", () => {
    expect(generateNextNumber("", 1)).toBe("-00001");
  });
});
