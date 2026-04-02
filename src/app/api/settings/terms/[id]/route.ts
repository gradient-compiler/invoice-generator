import { NextResponse } from "next/server";
import { db } from "@/db";
import { terms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const termPartialSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  isActive: z.coerce.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;
    const body = await request.json();
    const parsed = termPartialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(terms)
      .where(eq(terms.id, parseInt(id)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }

    const result = db
      .update(terms)
      .set(parsed.data)
      .where(eq(terms.id, parseInt(id)))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update term error:", error);
    return NextResponse.json(
      { error: "Failed to update term" },
      { status: 500 }
    );
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

    const existing = db
      .select()
      .from(terms)
      .where(eq(terms.id, parseInt(id)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }

    db.delete(terms).where(eq(terms.id, parseInt(id))).run();

    return NextResponse.json({ message: "Term deleted" });
  } catch (error) {
    console.error("Delete term error:", error);
    return NextResponse.json(
      { error: "Failed to delete term" },
      { status: 500 }
    );
  }
}
