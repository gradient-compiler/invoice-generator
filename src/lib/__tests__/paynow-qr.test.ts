import { describe, it, expect, vi } from "vitest";

// Mock the qrcode module to avoid actual QR generation
vi.mock("qrcode", () => ({
  toDataURL: vi.fn(async (payload: string) => `data:image/png;base64,MOCK_${payload.slice(0, 20)}`),
}));

import { generatePayNowQR, buildPayNowPayload } from "../paynow-qr";

describe("buildPayNowPayload", () => {
  it("throws when neither UEN nor mobile is provided", () => {
    expect(() => buildPayNowPayload({})).toThrow(
      "Either UEN or mobile number must be provided"
    );
  });

  it("builds payload with UEN (proxy type 2)", () => {
    const payload = buildPayNowPayload({ uen: "12345678A" });
    // Should contain proxy type "2" for UEN
    expect(payload).toContain("12345678A");
    // Payload starts with format indicator "000201"
    expect(payload).toMatch(/^000201/);
    // Ends with CRC (4 hex chars)
    expect(payload).toMatch(/[0-9A-F]{4}$/);
  });

  it("builds payload with mobile and prepends +65", () => {
    const payload = buildPayNowPayload({ mobile: "91234567" });
    expect(payload).toContain("+6591234567");
  });

  it("does not double-prepend +65 on mobile", () => {
    const payload = buildPayNowPayload({ mobile: "+6591234567" });
    // Should not contain "+65+65"
    expect(payload).not.toContain("+65+65");
    expect(payload).toContain("+6591234567");
  });

  it("includes amount when > 0", () => {
    const payload = buildPayNowPayload({ uen: "12345678A", amount: 100 });
    // Tag 54 is transaction amount
    expect(payload).toContain("5403100");
  });

  it("omits amount when 0", () => {
    const payload = buildPayNowPayload({ uen: "12345678A", amount: 0 });
    // Tag 54 should not appear
    expect(payload).not.toMatch(/54\d\d/);
  });

  it("omits amount when undefined", () => {
    const payload = buildPayNowPayload({ uen: "12345678A" });
    expect(payload).not.toMatch(/54\d\d/);
  });

  it("includes reference as additional data field", () => {
    const payload = buildPayNowPayload({
      uen: "12345678A",
      reference: "INV-0001",
    });
    // Reference should be in the payload
    expect(payload).toContain("INV-0001");
  });

  it("truncates merchant name to 25 chars", () => {
    const longName = "A".repeat(30);
    const payload = buildPayNowPayload({
      uen: "12345678A",
      merchantName: longName,
    });
    // Should contain truncated name (25 chars)
    expect(payload).toContain("A".repeat(25));
    // Tag 59 length should be 25
    expect(payload).toContain("5925");
  });

  it("uses 'NA' as default merchant name", () => {
    const payload = buildPayNowPayload({ uen: "12345678A" });
    expect(payload).toContain("5902NA");
  });

  it("sets editable flag to 0 when false", () => {
    const payloadEditable = buildPayNowPayload({
      uen: "12345678A",
      editable: true,
    });
    const payloadNotEditable = buildPayNowPayload({
      uen: "12345678A",
      editable: false,
    });
    // The editable flag is sub-tag 03 within the merchant account
    expect(payloadEditable).toContain("03011");
    expect(payloadNotEditable).toContain("03010");
  });

  it("includes country code SG", () => {
    const payload = buildPayNowPayload({ uen: "12345678A" });
    expect(payload).toContain("5802SG");
  });

  it("includes currency code 702 (SGD)", () => {
    const payload = buildPayNowPayload({ uen: "12345678A" });
    expect(payload).toContain("5303702");
  });

  it("has valid CRC-16 at the end", () => {
    const payload = buildPayNowPayload({ uen: "12345678A" });
    // Last 4 chars are hex CRC, preceded by "6304"
    const crcMarkerIdx = payload.lastIndexOf("6304");
    expect(crcMarkerIdx).toBeGreaterThan(0);
    const crc = payload.slice(crcMarkerIdx + 4);
    expect(crc).toMatch(/^[0-9A-F]{4}$/);
  });
});

describe("generatePayNowQR", () => {
  it("returns a data URI string", async () => {
    const result = await generatePayNowQR({ uen: "12345678A" });
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});
