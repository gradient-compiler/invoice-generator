# Deployment & Packaging Guide

This document covers the different ways to package, deploy, and secure the database for the Invoice Generator app.

## Current Architecture

- **Framework:** Next.js 16 (App Router)
- **Database:** SQLite via better-sqlite3 + Drizzle ORM
- **Database location:** `./data/invoice-generator.db`
- **Uploads:** `./public/uploads/` (logos)

The database auto-initializes on first request. No external services required.

---

## Option A: Docker (Self-Hosted)

Best for: running on a personal server, NAS, or cloud VM.

### Pros
- Data persists in Docker volumes across container rebuilds
- Reproducible builds, easy to migrate between machines
- Simple backup via `docker cp` or volume snapshots

### Cons
- Single machine only (SQLite is not suitable for multi-server)
- Requires Docker installed
- `better-sqlite3` needs native compilation (build tools in Docker image)

### Setup

1. Add `output: "standalone"` to `next.config.ts`:
```ts
const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
};
```

2. Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache python3 make g++
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN mkdir -p data public/uploads
EXPOSE 3000
CMD ["node", "server.js"]
```

3. Create a `docker-compose.yml`:
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - invoice-data:/app/data
      - invoice-uploads:/app/public/uploads
    restart: unless-stopped

volumes:
  invoice-data:
  invoice-uploads:
```

4. Run:
```bash
docker compose up -d
```

### Data Safety
- Named volumes (`invoice-data`, `invoice-uploads`) survive container deletion
- **Warning:** `docker compose down -v` deletes volumes and all data
- Back up with: `docker cp <container>:/app/data ./backup/`

---

## Option B: Desktop App (Electron / Tauri)

Best for: a native desktop experience on macOS or Windows.

### Electron
- **Pros:** Mature ecosystem, full Node.js access, easy SQLite integration
- **Cons:** Large bundle (~200MB), high memory usage
- **Data location:** `~/Library/Application Support/invoice-generator/` (macOS) or `%APPDATA%/invoice-generator/` (Windows)
- **Setup:** Use `electron-builder` to package the Next.js app. Store the SQLite database in the OS app data directory so it persists across reinstalls.

### Tauri v2 (Recommended)
- **Pros:** Much smaller bundle (~10-20MB), lower memory, more secure (Rust backend)
- **Cons:** Requires Rust toolchain, `better-sqlite3` is a Node native module so you'd need to either:
  - Use a Tauri-compatible SQLite library (e.g., `tauri-plugin-sql`)
  - Or run the Next.js server as a sidecar process
- **Data location:** Same OS-standard paths as Electron

### Data Safety
- OS app data directories persist across app updates and reinstalls
- Uninstalling the app does NOT delete `~/Library/Application Support/` data on macOS
- On Windows, data in `%APPDATA%` also persists unless manually deleted

---

## Option C: Cloud Database (Multi-Device)

Best for: accessing invoices from multiple devices (Mac, phone, etc.).

### Turso (libSQL) - Easiest Migration
- SQLite-compatible wire protocol, minimal code changes
- Drizzle ORM supports it via `@libsql/client`
- Free tier: 500 databases, 9GB storage
- **Migration steps:**
  1. `npm install @libsql/client`
  2. Update `src/db/index.ts` to use Turso client when `TURSO_DATABASE_URL` is set
  3. No schema changes needed (libSQL is SQLite-compatible)
  4. Export existing data with `.dump` and import to Turso

### PostgreSQL (Supabase / Neon / Railway)
- Wider hosting ecosystem, managed backups, point-in-time recovery
- **Migration effort:** Medium-high. Requires schema changes:
  - `integer("id").primaryKey({ autoIncrement: true })` -> `serial("id").primaryKey()`
  - SQLite-specific syntax adjustments
  - Update `drizzle.config.ts` dialect to `"postgresql"`
- **Hosting options:**
  - Supabase: Free tier, built-in auth and storage
  - Neon: Serverless PostgreSQL, generous free tier
  - Railway: Simple deployment, $5/mo

### Data Safety
- Cloud-managed with automatic backups
- Point-in-time recovery available on most providers
- Data accessible from any device with internet

---

## Option D: Database Backup Feature (Quick Win)

Regardless of deployment method, a manual backup/restore feature provides a safety net.

### Implementation (already planned)
- `GET /api/settings/backup` — download the `.db` file
- `POST /api/settings/backup` — restore from uploaded `.db` file
- Add backup/restore buttons to Settings page

### Manual Backup
The database is a single file. You can back it up anytime:
```bash
# Copy the database file
cp data/invoice-generator.db ~/backups/invoice-generator-$(date +%Y%m%d).db

# Also back up uploaded logos
cp -r public/uploads ~/backups/uploads-$(date +%Y%m%d)/
```

---

## Recommendation

| Priority | Action | Effort |
|----------|--------|--------|
| 1 | **Manual backups** of `data/` directory | None |
| 2 | **Docker** for reproducible deployment | Low |
| 3 | **Turso** migration for multi-device access | Medium |
| 4 | **Tauri** packaging for native desktop app | High |

Start with regular manual backups. If you need multi-device access, Turso is the lowest-friction migration path since it's SQLite-compatible. Docker is recommended for any server deployment.

---

## Environment Variables

For flexible deployment, the app can be configured to read the database path from an environment variable:

```bash
# Override default database location
INVOICE_DB_DIR=/path/to/persistent/data npm start
```

This allows storing data outside the app directory, which is essential for:
- Docker volume mounts
- Desktop app data directories
- Separating data from code on servers
