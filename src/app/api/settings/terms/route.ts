import { NextResponse } from "next/server";
import { db } from "@/db";
import { terms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { termSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    let result;
    if (year) {
      result = db
        .select()
        .from(terms)
        .where(eq(terms.year, parseInt(year)))
        .all();
    } else {
      result = db.select().from(terms).all();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("List terms error:", error);
    return NextResponse.json(
      { error: "Failed to list terms" },
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
    const parsed = termSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    const { name, startDate, endDate, year, isActive } = parsed.data;

    const result = db
      .insert(terms)
      .values({
        name,
        startDate,
        endDate,
        year,
        isActive: isActive !== undefined ? isActive : true,
      })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create term error:", error);
    return NextResponse.json(
      { error: "Failed to create term" },
      { status: 500 }
    );
  }
}
