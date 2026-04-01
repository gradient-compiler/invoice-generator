import { NextResponse } from "next/server";
import { db } from "@/db";
import { rateTiers } from "@/db/schema";
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
      .from(rateTiers)
      .where(eq(rateTiers.id, parseInt(id)))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Rate tier not found" },
        { status: 404 }
      );
    }

    const result = db
      .update(rateTiers)
      .set(body)
      .where(eq(rateTiers.id, parseInt(id)))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update rate tier error:", error);
    return NextResponse.json(
      { error: "Failed to update rate tier" },
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

    const result = db
      .update(rateTiers)
      .set({ isActive: false })
      .where(eq(rateTiers.id, parseInt(id)))
      .returning()
      .get();

    if (!result) {
      return NextResponse.json(
        { error: "Rate tier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Rate tier deactivated", rateTier: result });
  } catch (error) {
    console.error("Delete rate tier error:", error);
    return NextResponse.json(
      { error: "Failed to delete rate tier" },
      { status: 500 }
    );
  }
}
