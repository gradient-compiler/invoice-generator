import { NextResponse } from "next/server";
import { db } from "@/db";
import { businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { hashPassword, isAuthSetup, createSessionToken, buildSessionCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const setupSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    ensureDbInitialized();

    if (isAuthSetup()) {
      return NextResponse.json(
        { error: "Admin password is already configured. Use the login endpoint." },
        { status: 409 }
      );
    }

    const body = await request.json();
    const parsed = setupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    db.update(businessSettings)
      .set({ adminPasswordHash: passwordHash, updatedAt: new Date().toISOString() })
      .where(eq(businessSettings.id, 1))
      .run();

    const token = createSessionToken();
    const response = NextResponse.json({ success: true, message: "Admin password set" });
    response.headers.set("Set-Cookie", buildSessionCookie(token));
    logAudit({ action: "auth_setup", entityType: "auth", request });
    return response;
  } catch (error) {
    console.error("Auth setup error:", error);
    return NextResponse.json({ error: "Failed to set up authentication" }, { status: 500 });
  }
}
