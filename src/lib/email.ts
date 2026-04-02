import nodemailer from "nodemailer";
import { db } from "@/db";
import { businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { safeDecrypt } from "@/lib/crypto";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export function getSmtpConfig(): SmtpConfig | null {
  ensureDbInitialized();
  const settings = db
    .select()
    .from(businessSettings)
    .where(eq(businessSettings.id, 1))
    .get();

  if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
    return null;
  }

  return {
    host: settings.smtpHost,
    port: settings.smtpPort ?? 587,
    secure: settings.smtpSecure ?? false,
    user: settings.smtpUser,
    pass: safeDecrypt(settings.smtpPass) || settings.smtpPass,
    fromName: settings.smtpFromName || settings.businessName || "Invoice Generator",
    fromEmail: settings.smtpFromEmail || settings.email || settings.smtpUser,
  };
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}) {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error("SMTP not configured. Go to Settings > Email / SMTP to set up email.");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });
}
