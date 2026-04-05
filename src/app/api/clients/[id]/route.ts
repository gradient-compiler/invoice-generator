import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { clientSchema } from "@/lib/validators";
import { safeEncrypt, safeDecrypt } from "@/lib/crypto";
import { parseId } from "@/lib/parse-id";

const CLIENT_UPDATABLE_FIELDS = new Set([
  "name", "parentName", "email", "phone", "address",
  "notes", "gradeLevel", "clientType", "isActive",
]);

function pickAllowed<T extends Record<string, unknown>>(obj: T, allowed: Set<string>): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (allowed.has(key)) result[key] = obj[key];
  }
  return result as Partial<T>;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;
    const parsed = parseId(id);
    if ("error" in parsed) return parsed.error;

    const client = db
      .select()
      .from(clients)
      .where(eq(clients.id, parsed.id))
      .get();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const decryptedClient = {
      ...client,
      email: safeDecrypt(client.email),
      phone: safeDecrypt(client.phone),
      address: safeDecrypt(client.address),
    };

    return NextResponse.json(decryptedClient);
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
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;
    const parsedId = parseId(id);
    if ("error" in parsedId) return parsedId.error;
    const numericId = parsedId.id;

    const body = await request.json();
    const parsed = clientSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(clients)
      .where(eq(clients.id, numericId))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const filteredData = pickAllowed(
      parsed.data as Record<string, unknown>,
      CLIENT_UPDATABLE_FIELDS
    );

    if (filteredData.email !== undefined) filteredData.email = safeEncrypt(filteredData.email as string);
    if (filteredData.phone !== undefined) filteredData.phone = safeEncrypt(filteredData.phone as string);
    if (filteredData.address !== undefined) filteredData.address = safeEncrypt(filteredData.address as string);

    const result = db
      .update(clients)
      .set({
        ...filteredData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(clients.id, numericId))
      .returning()
      .get();

    const decryptedResult = {
      ...result,
      email: safeDecrypt(result.email),
      phone: safeDecrypt(result.phone),
      address: safeDecrypt(result.address),
    };

    return NextResponse.json(decryptedResult);
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
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();
    const { id } = await params;
    const parsedId = parseId(id);
    if ("error" in parsedId) return parsedId.error;

    const result = db
      .update(clients)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(clients.id, parsedId.id))
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
