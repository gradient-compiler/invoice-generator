import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, and, like, sql } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function GET(request: Request) {
  try {
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

    return NextResponse.json(result);
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
    ensureDbInitialized();

    const body = await request.json();
    const { name, parentName, email, phone, address, notes, gradeLevel, clientType } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const result = db
      .insert(clients)
      .values({
        name,
        parentName: parentName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        gradeLevel: gradeLevel || null,
        clientType: clientType || "tuition",
        isActive: true,
      })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
