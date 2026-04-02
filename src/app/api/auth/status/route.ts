import { NextResponse } from "next/server";
import { ensureDbInitialized } from "@/db/init";
import { isAuthenticated, isAuthSetup } from "@/lib/auth";

export async function GET(request: Request) {
  ensureDbInitialized();
  const setup = isAuthSetup();
  const authenticated = setup ? isAuthenticated(request) : true;

  return NextResponse.json({
    authRequired: setup,
    authenticated,
  });
}
