import { defineConfig } from "drizzle-kit";
import path from "path";

const dbDir = process.env.INVOICE_DB_DIR || "./data";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: path.join(dbDir, "invoice-generator.db"),
  },
});
