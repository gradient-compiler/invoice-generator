import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { encrypt, decrypt, isEncrypted, safeEncrypt, safeDecrypt } from "../crypto";

const TEST_KEY = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";

describe("crypto", () => {
  let originalKey: string | undefined;

  beforeAll(() => {
    originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  afterAll(() => {
    if (originalKey !== undefined) {
      process.env.ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe("encrypt / decrypt", () => {
    it("roundtrips plaintext", () => {
      const plaintext = "hello world";
      const encrypted = encrypt(plaintext);
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it("produces different ciphertexts for same plaintext (random IV)", () => {
      const a = encrypt("test");
      const b = encrypt("test");
      expect(a).not.toBe(b);
    });

    it("encrypted output is in iv:ciphertext:tag format", () => {
      const encrypted = encrypt("test");
      const parts = encrypted.split(":");
      expect(parts).toHaveLength(3);
      expect(parts[0]).toMatch(/^[0-9a-f]+$/);
    });

    it("throws on tampered ciphertext", () => {
      const encrypted = encrypt("test");
      const parts = encrypted.split(":");
      parts[1] = "0000" + parts[1].slice(4);
      expect(() => decrypt(parts.join(":"))).toThrow();
    });

    it("throws on wrong format", () => {
      expect(() => decrypt("not:enough")).toThrow("Invalid encrypted data format");
    });
  });

  describe("isEncrypted", () => {
    it("returns true for encrypted format", () => {
      const encrypted = encrypt("test");
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it("returns false for plaintext", () => {
      expect(isEncrypted("hello world")).toBe(false);
    });

    it("returns false for two-part string", () => {
      expect(isEncrypted("a:b")).toBe(false);
    });
  });

  describe("safeEncrypt", () => {
    it("returns null for null", () => {
      expect(safeEncrypt(null)).toBeNull();
    });

    it("returns null for undefined", () => {
      expect(safeEncrypt(undefined)).toBeNull();
    });

    it("encrypts plaintext", () => {
      const result = safeEncrypt("hello");
      expect(result).not.toBe("hello");
      expect(isEncrypted(result!)).toBe(true);
    });

    it("does not double-encrypt", () => {
      const encrypted = encrypt("hello");
      expect(safeEncrypt(encrypted)).toBe(encrypted);
    });
  });

  describe("safeDecrypt", () => {
    it("returns null for null", () => {
      expect(safeDecrypt(null)).toBeNull();
    });

    it("returns null for undefined", () => {
      expect(safeDecrypt(undefined)).toBeNull();
    });

    it("returns plaintext unchanged", () => {
      expect(safeDecrypt("hello")).toBe("hello");
    });

    it("decrypts encrypted value", () => {
      const encrypted = encrypt("secret");
      expect(safeDecrypt(encrypted)).toBe("secret");
    });
  });
});

describe("crypto without ENCRYPTION_KEY", () => {
  let originalKey: string | undefined;

  beforeAll(() => {
    originalKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
  });

  afterAll(() => {
    if (originalKey !== undefined) {
      process.env.ENCRYPTION_KEY = originalKey;
    }
  });

  it("encrypt throws when key is missing", () => {
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY");
  });

  it("safeEncrypt returns value unchanged when key is missing", () => {
    expect(safeEncrypt("hello")).toBe("hello");
  });
});
