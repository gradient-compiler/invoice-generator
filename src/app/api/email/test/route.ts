import { NextResponse } from "next/server";
import { db } from "@/db";
import { businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { sendEmail } from "@/lib/email";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();

    const settings = db
      .select()
      .from(businessSettings)
      .where(eq(businessSettings.id, 1))
      .get();

    const toEmail = settings?.smtpFromEmail || settings?.email || settings?.smtpUser;
    if (!toEmail) {
      return NextResponse.json(
        { error: "No email address configured to send test to" },
        { status: 400 }
      );
    }

    await sendEmail({
      to: toEmail,
      subject: "Test Email — Invoice Generator",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>SMTP Configuration Test</h2>
          <p>If you're reading this, your email settings are working correctly.</p>
          <p style="color: #666; font-size: 14px;">Sent from Invoice Generator</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, sentTo: toEmail });
  } catch (error) {
    console.error("Test email error:", error);
    const message = error instanceof Error ? error.message : "Failed to send test email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
