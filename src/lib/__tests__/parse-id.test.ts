import { describe, it, expect } from "vitest";
import { parseId } from "../parse-id";

describe("parseId", () => {
  it("parses a valid positive integer", () => {
    expect(parseId("42")).toEqual({ id: 42 });
  });

  it("parses 1 as valid", () => {
    expect(parseId("1")).toEqual({ id: 1 });
  });

  it("returns error for 0", () => {
    const result = parseId("0");
    expect("error" in result).toBe(true);
  });

  it("returns error for negative numbers", () => {
    const result = parseId("-1");
    expect("error" in result).toBe(true);
  });

  it("returns error for non-numeric strings", () => {
    const result = parseId("abc");
    expect("error" in result).toBe(true);
  });

  it("returns error for empty string", () => {
    const result = parseId("");
    expect("error" in result).toBe(true);
  });

  it("truncates decimal to integer via parseInt", () => {
    expect(parseId("3.5")).toEqual({ id: 3 });
  });
});
