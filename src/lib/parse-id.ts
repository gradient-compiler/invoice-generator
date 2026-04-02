import { NextResponse } from "next/server";

/**
 * Safely parse a route parameter as a positive integer ID.
 * Returns the parsed number, or a 400 NextResponse if invalid.
 */
export function parseId(
  value: string
): { id: number } | { error: NextResponse } {
  const id = parseInt(value, 10);
  if (isNaN(id) || id <= 0) {
    return {
      error: NextResponse.json(
        { error: "Invalid ID parameter" },
        { status: 400 }
      ),
    };
  }
  return { id };
}
