import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;

    const existing = db
      .select()
      .from(invoices)
      .where(eq(invoices.id, parseInt(id)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // If already has a token, return it
    if (existing.shareToken) {
      return NextResponse.json({ token: existing.shareToken });
    }

    const token = crypto.randomUUID();
    // Share tokens expire after 30 days
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.update(invoices)
      .set({ shareToken: token, shareTokenExpiresAt: expiresAt, updatedAt: new Date().toISOString() })
      .where(eq(invoices.id, parseInt(id)))
      .run();

    logAudit({ action: "invoice_share", entityType: "invoice", entityId: id, request });
    return NextResponse.json({ token, expiresAt });
  } catch (error) {
    console.error("Generate share token error:", error);
    return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;

    db.update(invoices)
      .set({ shareToken: null, shareTokenExpiresAt: null, updatedAt: new Date().toISOString() })
      .where(eq(invoices.id, parseInt(id)))
      .run();

    logAudit({ action: "invoice_unshare", entityType: "invoice", entityId: id, request });
    return NextResponse.json({ message: "Share link revoked" });
  } catch (error) {
    console.error("Revoke share token error:", error);
    return NextResponse.json({ error: "Failed to revoke share link" }, { status: 500 });
  }
}
