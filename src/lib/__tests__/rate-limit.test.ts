import { describe, it, expect, beforeEach, vi } from "vitest";

// Use fake timers before importing to control the module-level setInterval
vi.useFakeTimers();

import { checkRateLimit, getClientIp, type RateLimitConfig } from "../rate-limit";

const config: RateLimitConfig = {
  maxRequests: 3,
  windowMs: 60_000,
};

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Advance time significantly to clear any previous state
    vi.advanceTimersByTime(600_001);
  });

  it("allows first request", () => {
    const result = checkRateLimit("test-first", config);
    expect(result.allowed).toBe(true);
  });

  it("allows requests up to the limit", () => {
    const key = "test-limit-" + Date.now();
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit(key, config);
      expect(result.allowed).toBe(true);
    }
  });

  it("denies request beyond the limit", () => {
    const key = "test-deny-" + Date.now();
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, config);
    }
    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("decreases remaining count", () => {
    const key = "test-remaining-" + Date.now();
    expect(checkRateLimit(key, config).remaining).toBe(2);
    expect(checkRateLimit(key, config).remaining).toBe(1);
    expect(checkRateLimit(key, config).remaining).toBe(0);
  });

  it("returns retryAfterMs when denied", () => {
    const key = "test-retry-" + Date.now();
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, config);
    }
    const result = checkRateLimit(key, config);
    expect(result.retryAfterMs).toBeDefined();
    expect(result.retryAfterMs!).toBeGreaterThan(0);
    expect(result.retryAfterMs!).toBeLessThanOrEqual(60_000);
  });

  it("allows requests again after window elapses", () => {
    const key = "test-window-" + Date.now();
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, config);
    }
    expect(checkRateLimit(key, config).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(checkRateLimit(key, config).allowed).toBe(true);
  });

  it("isolates different keys", () => {
    const keyA = "key-a-" + Date.now();
    const keyB = "key-b-" + Date.now();
    for (let i = 0; i < 3; i++) {
      checkRateLimit(keyA, config);
    }
    expect(checkRateLimit(keyA, config).allowed).toBe(false);
    expect(checkRateLimit(keyB, config).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("extracts IP from X-Forwarded-For", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to X-Real-IP", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "9.8.7.6" },
    });
    expect(getClientIp(req)).toBe("9.8.7.6");
  });

  it("returns 'unknown' when no headers", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });
});
