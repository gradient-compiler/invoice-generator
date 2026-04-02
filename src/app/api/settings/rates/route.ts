import { NextResponse } from "next/server";
import { db } from "@/db";
import { rateTiers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/db/init";
import { requireAuth } from "@/lib/auth";
import { rateTierSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const authError = requireAuth(request);
    if (authError) return authError;
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
    const authError = requireAuth(request);
    if (authError) return authError;
    ensureDbInitialized();

    const body = await request.json();
    const parsed = rateTierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    const { name, rate, currency, rateType, description } = parsed.data;

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
