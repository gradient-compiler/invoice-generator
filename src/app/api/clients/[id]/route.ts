import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureDbInitialized();
    const { id } = await params;

    const client = db
      .select()
      .from(clients)
      .where(eq(clients.id, parseInt(id)))
      .get();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Get client error:", error);
    return NextResponse.json(
      { error: "Failed to get client" },
      { status: 500 }
    );
  }
}

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
      .from(clients)
      .where(eq(clients.id, parseInt(id)))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const result = db
      .update(clients)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(clients.id, parseInt(id)))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
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
      .update(clients)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(clients.id, parseInt(id)))
      .returning()
      .get();

    if (!result) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Client deactivated", client: result });
  } catch (error) {
    console.error("Delete client error:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
