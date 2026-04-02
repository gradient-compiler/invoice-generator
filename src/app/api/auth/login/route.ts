import { NextResponse } from "next/server";
import { db } from "@/db";
import { businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { verifyPassword, createSessionToken, buildSessionCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    ensureDbInitialized();

    // Rate limit: max 5 login attempts per minute per IP
    const rl = checkRateLimit(`login:${getClientIp(request)}`, { maxRequests: 5, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const settings = db
      .select({ adminPasswordHash: businessSettings.adminPasswordHash })
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    if (!settings?.adminPasswordHash) {
      return NextResponse.json(
        { error: "Authentication not set up. Use /api/auth/setup first." },
        { status: 400 }
      );
    }

    const valid = await verifyPassword(parsed.data.password, settings.adminPasswordHash);
    if (!valid) {
      logAudit({ action: "login_failed", entityType: "auth", request });
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = createSessionToken();
    const response = NextResponse.json({ success: true });
    response.headers.set("Set-Cookie", buildSessionCookie(token));
    logAudit({ action: "login", entityType: "auth", request });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
