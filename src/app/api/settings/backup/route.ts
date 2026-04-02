import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { dbPath } from "@/db";
import { ensureDbInitialized } from "@/db/init";
import fs from "fs";
import path from "path";

const SQLITE_MAGIC = "SQLite format 3\0";
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB

export async function GET(request: Request) {
  try {
    ensureDbInitialized();
    const authError = requireAuth(request);
    if (authError) return authError;

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json(
        { error: "Database file not found" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(dbPath);
    const filename = `invoice-generator-backup-${new Date().toISOString().slice(0, 10)}.db`;

    logAudit({
      action: "backup_download",
      entityType: "backup",
      request,
    });

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error("Backup download error:", error);
    return NextResponse.json(
      { error: "Failed to download backup" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    ensureDbInitialized();
    const authError = requireAuth(request);
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get("database") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No database file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate SQLite magic bytes
    const header = buffer.slice(0, 16).toString("ascii");
    if (header !== SQLITE_MAGIC) {
      return NextResponse.json(
        { error: "Invalid file. Please upload a valid SQLite database" },
        { status: 400 }
      );
    }

    // Write to a temp file first, then rename for atomicity
    const tmpPath = dbPath + ".restore-tmp";
    fs.writeFileSync(tmpPath, buffer);

    // Back up the current database before replacing
    const backupDir = path.dirname(dbPath);
    const currentBackupPath = path.join(
      backupDir,
      `invoice-generator-pre-restore-${Date.now()}.db`
    );
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, currentBackupPath);
    }

    // Replace the database file
    fs.renameSync(tmpPath, dbPath);

    logAudit({
      action: "backup_restore",
      entityType: "backup",
      detail: `Restored from uploaded file: ${file.name} (${file.size} bytes)`,
      request,
    });

    return NextResponse.json({
      success: true,
      message:
        "Database restored successfully. Please restart the application for changes to take full effect.",
    });
  } catch (error) {
    console.error("Backup restore error:", error);
    // Clean up temp file if it exists
    const tmpPath = dbPath + ".restore-tmp";
    if (fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        // ignore cleanup errors
      }
    }
    return NextResponse.json(
      { error: "Failed to restore backup" },
      { status: 500 }
    );
  }
}
