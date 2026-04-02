import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, and, like, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { clientSchema } from "@/lib/validators";
import { safeEncrypt, safeDecrypt } from "@/lib/crypto";

export async function GET(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const active = searchParams.get("active");
    const grade = searchParams.get("grade");

    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${clients.name} LIKE ${"%" + search + "%"} OR ${clients.parentName} LIKE ${"%" + search + "%"})`
      );
    }

    if (type) {
      conditions.push(eq(clients.clientType, type));
    }

    if (active !== null && active !== undefined && active !== "") {
      conditions.push(eq(clients.isActive, active === "true"));
    }

    if (grade) {
      conditions.push(eq(clients.gradeLevel, grade));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = db
      .select()
      .from(clients)
      .where(where)
      .orderBy(clients.name)
      .all();

    const decryptedClients = result.map((c: any) => ({
      ...c,
      email: safeDecrypt(c.email),
      phone: safeDecrypt(c.phone),
      address: safeDecrypt(c.address),
    }));

    return NextResponse.json(decryptedClients);
  } catch (error) {
    console.error("List clients error:", error);
    return NextResponse.json(
      { error: "Failed to list clients" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();

    const body = await request.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    const { name, parentName, email, phone, address, notes, gradeLevel, clientType } = parsed.data;

    const result = db
      .insert(clients)
      .values({
        name,
        parentName: parentName || null,
        email: safeEncrypt(email) || null,
        phone: safeEncrypt(phone) || null,
        address: safeEncrypt(address) || null,
        notes: notes || null,
        gradeLevel: gradeLevel || null,
        clientType: clientType || "tuition",
        isActive: true,
      })
      .returning()
      .get();

    const decryptedResult = {
      ...result,
      email: safeDecrypt(result.email),
      phone: safeDecrypt(result.phone),
      address: safeDecrypt(result.address),
    };

    return NextResponse.json(decryptedResult, { status: 201 });
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
