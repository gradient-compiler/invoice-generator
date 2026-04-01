import { NextResponse } from "next/server";
import { db } from "@/db";
import { rateTiers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";

export async function GET(request: Request) {
  try {
    ensureDbInitialized();

    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    let result;
    if (active !== null && active !== "") {
      result = db
        .select()
        .from(rateTiers)
        .where(eq(rateTiers.isActive, active === "true"))
        .all();
    } else {
      result = db.select().from(rateTiers).all();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("List rate tiers error:", error);
    return NextResponse.json(
      { error: "Failed to list rate tiers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    ensureDbInitialized();

    const body = await request.json();
    const { name, rate, currency, rateType, description } = body;

    if (!name || rate === undefined) {
      return NextResponse.json(
        { error: "Name and rate are required" },
        { status: 400 }
      );
    }

    const result = db
      .insert(rateTiers)
      .values({
        name,
        rate,
        currency: currency || "SGD",
        rateType: rateType || "hourly",
        description: description || null,
        isActive: true,
      })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create rate tier error:", error);
    return NextResponse.json(
      { error: "Failed to create rate tier" },
      { status: 500 }
    );
  }
}
