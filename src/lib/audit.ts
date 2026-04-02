import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getClientIp } from "@/lib/rate-limit";

export type AuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "auth_setup"
  | "settings_update"
  | "client_create"
  | "client_update"
  | "client_delete"
  | "invoice_create"
  | "invoice_update"
  | "invoice_delete"
  | "invoice_status_change"
  | "invoice_duplicate"
  | "invoice_share"
  | "invoice_unshare"
  | "receipt_create"
  | "receipt_update"
  | "receipt_delete"
  | "credit_note_create"
  | "credit_note_update"
  | "credit_note_delete"
  | "session_create"
  | "session_update"
  | "session_delete"
  | "email_send"
  | "email_reminder"
  | "export_data"
  | "portal_access"
  | "recurring_create"
  | "recurring_update"
  | "recurring_delete"
  | "recurring_process"
  | "backup_download"
  | "backup_restore";

export type EntityType =
  | "settings"
  | "client"
  | "invoice"
  | "receipt"
  | "credit_note"
  | "session"
  | "email"
  | "export"
  | "auth"
  | "portal"
  | "recurring_invoice"
  | "backup";

/**
 * Log an auditable action.
 */
export function logAudit(opts: {
  action: AuditAction;
  entityType: EntityType;
  entityId?: string | number;
  detail?: string;
  request?: Request;
}) {
  try {
    const ipAddress = opts.request ? getClientIp(opts.request) : null;
    db.insert(auditLogs)
      .values({
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId != null ? String(opts.entityId) : null,
        detail: opts.detail || null,
        ipAddress,
      })
      .run();
  } catch {
    // Audit logging should never break the main operation
  }
}
