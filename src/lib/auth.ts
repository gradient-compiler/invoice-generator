import crypto from "crypto";
import { db } from "@/db";
import { businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELISM = 1;
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const COOKIE_NAME = "invoice_session";

/**
 * Hash a password using scrypt with a random salt.
 * Returns "salt:hash" (both hex-encoded).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_COST, r: SCRYPT_BLOCK_SIZE, p: SCRYPT_PARALLELISM },
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(`${salt}:${derivedKey.toString("hex")}`);
      }
    );
  });
}

/**
 * Verify a password against a stored "salt:hash" string.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_COST, r: SCRYPT_BLOCK_SIZE, p: SCRYPT_PARALLELISM },
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(crypto.timingSafeEqual(derivedKey, Buffer.from(hash, "hex")));
      }
    );
  });
}

function getSessionSecret(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is required for session signing");
  }
  return key;
}

/**
 * Create a signed session token with an expiry timestamp.
 */
export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${expiresAt}`;
  const hmac = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${hmac}`;
}

/**
 * Verify a session token's signature and expiry.
 */
export function verifySessionToken(token: string): boolean {
  const dotIdx = token.lastIndexOf(".");
  if (dotIdx === -1) return false;

  const payload = token.substring(0, dotIdx);
  const signature = token.substring(dotIdx + 1);

  const expectedHmac = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedHmac, "hex"))) {
    return false;
  }

  const expiresAt = parseInt(payload, 10);
  return !isNaN(expiresAt) && Date.now() < expiresAt;
}

/**
 * Build a Set-Cookie header for the session token.
 */
export function buildSessionCookie(token: string): string {
  const maxAge = Math.floor(SESSION_DURATION_MS / 1000);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

/**
 * Build a Set-Cookie header that clears the session.
 */
export function buildClearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`;
}

/**
 * Extract and verify the session token from a request.
 * Returns true if the request is authenticated.
 */
export function isAuthenticated(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return false;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, rest.join("=")];
    })
  );

  const token = cookies[COOKIE_NAME];
  if (!token) return false;

  return verifySessionToken(token);
}

/**
 * Check if the admin password has been set up.
 */
export function isAuthSetup(): boolean {
  const settings = db
    .select({ adminPasswordHash: businessSettings.adminPasswordHash })
    .from(businessSettings)
    .where(eq(businessSettings.id, 1))
    .get();

  return !!settings?.adminPasswordHash;
}

/**
 * Guard an API route — returns a 401 response if not authenticated.
 * Returns null if authenticated (route can proceed).
 *
 * If auth is not set up yet (no password configured), all requests are allowed
 * to avoid locking users out during initial setup.
 */
export function requireAuth(request: Request): NextResponse | null {
  // If no password has been set up yet, allow all access
  if (!isAuthSetup()) return null;

  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  return null;
}
