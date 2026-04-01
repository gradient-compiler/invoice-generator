import { NextResponse } from "next/server";
import { db } from "@/db";
import { terms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureDbInitialized();
    const { id } = await params;
    const body = await request.json();

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
      .set(body)
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
