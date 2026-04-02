import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

const TEST_KEY = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";

// Mock the db module to avoid SQLite dependency
vi.mock("@/db", () => ({
  db: {},
}));
vi.mock("@/db/schema", () => ({
  businessSettings: {},
}));

describe("auth", () => {
  let originalKey: string | undefined;
  let authModule: typeof import("../auth");

  beforeAll(async () => {
    originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = TEST_KEY;
    authModule = await import("../auth");
  });

  afterAll(() => {
    if (originalKey !== undefined) {
      process.env.ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe("hashPassword / verifyPassword", () => {
    it("produces salt:hash format", async () => {
      const hash = await authModule.hashPassword("password123");
      const parts = hash.split(":");
      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatch(/^[0-9a-f]+$/);
      expect(parts[1]).toMatch(/^[0-9a-f]+$/);
    });

    it("verifies correct password", async () => {
      const hash = await authModule.hashPassword("mySecret");
      expect(await authModule.verifyPassword("mySecret", hash)).toBe(true);
    });

    it("rejects wrong password", async () => {
      const hash = await authModule.hashPassword("mySecret");
      expect(await authModule.verifyPassword("wrongPass", hash)).toBe(false);
    });

    it("returns false for malformed hash", async () => {
      expect(await authModule.verifyPassword("test", "nocolon")).toBe(false);
    });
  });

  describe("createSessionToken / verifySessionToken", () => {
    it("creates a token in timestamp.hmac format", () => {
      const token = authModule.createSessionToken();
      expect(token).toMatch(/^\d+\.[0-9a-f]+$/);
    });

    it("verifies a valid token", () => {
      const token = authModule.createSessionToken();
      expect(authModule.verifySessionToken(token)).toBe(true);
    });

    it("rejects a token with tampered payload", () => {
      const token = authModule.createSessionToken();
      const [, sig] = token.split(".");
      const tampered = `9999999999999.${sig}`;
      expect(authModule.verifySessionToken(tampered)).toBe(false);
    });

    it("rejects a token with tampered signature", () => {
      const token = authModule.createSessionToken();
      const [payload] = token.split(".");
      const tampered = `${payload}.${"a".repeat(64)}`;
      expect(authModule.verifySessionToken(tampered)).toBe(false);
    });

    it("rejects a token without a dot", () => {
      expect(authModule.verifySessionToken("nodot")).toBe(false);
    });

    it("rejects an expired token", () => {
      // Create token, then advance time past 24 hours
      const token = authModule.createSessionToken();
      const originalNow = Date.now;
      Date.now = () => originalNow() + 25 * 60 * 60 * 1000; // +25 hours
      try {
        expect(authModule.verifySessionToken(token)).toBe(false);
      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe("buildSessionCookie", () => {
    it("contains the token value", () => {
      const cookie = authModule.buildSessionCookie("mytoken");
      expect(cookie).toContain("invoice_session=mytoken");
    });

    it("sets HttpOnly flag", () => {
      const cookie = authModule.buildSessionCookie("t");
      expect(cookie).toContain("HttpOnly");
    });

    it("sets SameSite=Strict", () => {
      const cookie = authModule.buildSessionCookie("t");
      expect(cookie).toContain("SameSite=Strict");
    });

    it("sets Max-Age to 24 hours", () => {
      const cookie = authModule.buildSessionCookie("t");
      expect(cookie).toContain("Max-Age=86400");
    });
  });

  describe("buildClearSessionCookie", () => {
    it("sets Max-Age=0", () => {
      const cookie = authModule.buildClearSessionCookie();
      expect(cookie).toContain("Max-Age=0");
    });

    it("clears the cookie value", () => {
      const cookie = authModule.buildClearSessionCookie();
      expect(cookie).toContain("invoice_session=;");
    });
  });

  describe("isAuthenticated", () => {
    it("returns false when no cookie header", () => {
      const req = new Request("http://localhost", {
        headers: {},
      });
      expect(authModule.isAuthenticated(req)).toBe(false);
    });

    it("returns false when cookie has no session token", () => {
      const req = new Request("http://localhost", {
        headers: { cookie: "other=value" },
      });
      expect(authModule.isAuthenticated(req)).toBe(false);
    });

    it("returns true for valid session cookie", () => {
      const token = authModule.createSessionToken();
      const req = new Request("http://localhost", {
        headers: { cookie: `invoice_session=${token}` },
      });
      expect(authModule.isAuthenticated(req)).toBe(true);
    });

    it("returns false for expired session cookie", () => {
      const token = authModule.createSessionToken();
      const originalNow = Date.now;
      Date.now = () => originalNow() + 25 * 60 * 60 * 1000;
      try {
        const req = new Request("http://localhost", {
          headers: { cookie: `invoice_session=${token}` },
        });
        expect(authModule.isAuthenticated(req)).toBe(false);
      } finally {
        Date.now = originalNow;
      }
    });
  });
});
