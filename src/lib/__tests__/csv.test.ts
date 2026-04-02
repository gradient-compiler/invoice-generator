import { describe, it, expect } from "vitest";
import { csvEscape, buildCsv } from "../csv";

describe("csvEscape", () => {
  it("returns plain strings unchanged", () => {
    expect(csvEscape("hello")).toBe("hello");
  });

  it("quotes strings containing commas", () => {
    expect(csvEscape("hello,world")).toBe('"hello,world"');
  });

  it("escapes double quotes by doubling them", () => {
    expect(csvEscape('has"quote')).toBe('"has""quote"');
  });

  it("quotes strings containing newlines", () => {
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });

  it("returns empty string for null", () => {
    expect(csvEscape(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(csvEscape(undefined)).toBe("");
  });

  it("coerces numbers to strings", () => {
    expect(csvEscape(123)).toBe("123");
  });

  describe("formula injection prevention", () => {
    it("prefixes = with single quote", () => {
      const result = csvEscape("=cmd");
      expect(result).toBe("\"'=cmd\"");
    });

    it("prefixes + with single quote", () => {
      const result = csvEscape("+cmd");
      expect(result).toBe("\"'+cmd\"");
    });

    it("prefixes - with single quote", () => {
      const result = csvEscape("-cmd");
      expect(result).toBe("\"'-cmd\"");
    });

    it("prefixes @ with single quote", () => {
      const result = csvEscape("@cmd");
      expect(result).toBe("\"'@cmd\"");
    });

    it("prefixes tab with single quote", () => {
      const result = csvEscape("\tcmd");
      expect(result).toBe("\"'\tcmd\"");
    });
  });
});

describe("buildCsv", () => {
  it("generates CSV from headers and rows", () => {
    const result = buildCsv(["a", "b"], [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ]);
    expect(result).toBe("a,b\n1,2\n3,4");
  });

  it("handles special characters in data", () => {
    const result = buildCsv(["name", "desc"], [
      { name: "Alice", desc: "hello,world" },
    ]);
    expect(result).toBe('name,desc\nAlice,"hello,world"');
  });

  it("handles empty rows", () => {
    const result = buildCsv(["a", "b"], []);
    expect(result).toBe("a,b");
  });
});
