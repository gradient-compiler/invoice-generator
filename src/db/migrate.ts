import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index";
import path from "path";

export function runMigrations() {
  const migrationsFolder = path.resolve(process.cwd(), "drizzle/migrations");
  migrate(db, { migrationsFolder });
}
