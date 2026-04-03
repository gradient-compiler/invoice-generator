import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbDir = process.env.INVOICE_DB_DIR || path.resolve(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const dbPath = path.resolve(dbDir, "invoice-generator.db");

let _db: ReturnType<typeof drizzle> | null = null;
let _initialized = false;

function getDb() {
  if (!_db) {
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    _db = drizzle(sqlite, { schema });
  }
  if (!_initialized) {
    _initialized = true;
    // Lazy import to avoid circular dependency (init.ts imports db from this file)
    const { ensureDbInitialized } = require("./init");
    ensureDbInitialized();
  }
  return _db;
}

// Backward-compatible export — lazily initializes on first property access
export const db: ReturnType<typeof drizzle> = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type DB = ReturnType<typeof drizzle>;
