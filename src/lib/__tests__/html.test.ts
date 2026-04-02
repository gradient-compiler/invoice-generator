import { describe, it, expect } from "vitest";
import { escapeHtml } from "../html";

describe("escapeHtml", () => {
  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('a "b" c')).toBe("a &quot;b&quot; c");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("a 'b' c")).toBe("a &#x27;b&#x27; c");
  });

  it("escapes ampersand", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes all special characters together", () => {
    expect(escapeHtml(`<div class="x" data-a='y'>&`)).toBe(
      "&lt;div class=&quot;x&quot; data-a=&#x27;y&#x27;&gt;&amp;"
    );
  });

  it("returns empty string for null", () => {
    expect(escapeHtml(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(escapeHtml(undefined)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("does not escape safe text", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });
});
