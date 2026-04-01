import { NextResponse } from "next/server";
import { db } from "@/db";
import { terms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function GET(request: Request) {
  try {
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
    ensureDbInitialized();

    const body = await request.json();
    const { name, startDate, endDate, year, isActive } = body;

    if (!name || !startDate || !endDate || !year) {
      return NextResponse.json(
        { error: "Name, startDate, endDate, and year are required" },
        { status: 400 }
      );
    }

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
