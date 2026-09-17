import "server-only";
import { db } from "@/db/client";
import { rootAdminAuditLogs } from "@/db/schema";
import { getRequestClientIp } from "@/modules/security/rate-limit";

export type AuditAction =
  | "login_success"
  | "login_failed"
  | "account_locked"
  | "change_password"
  | "create_admin"
  | "reset_password"
  | "lock_account"
  | "unlock_account"
  | "activate_invitation_without_payment"
  | "platform_setting_updated";

export async function logAdminAudit(params: {
  action: AuditAction;
  actorUserId?: string | null;
  targetUserId?: string | null;
  request?: Request | null;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (params.request) {
      ipAddress = getRequestClientIp(params.request);
      userAgent = params.request.headers.get("user-agent")?.slice(0, 500) || null;
    }

    await db.insert(rootAdminAuditLogs).values({
      id: crypto.randomUUID(),
      actorUserId: params.actorUserId ?? null,
      action: params.action,
      targetUserId: params.targetUserId ?? null,
      ipAddress,
      userAgent,
      details: params.details ?? null,
    });
  } catch (error) {
    // Non-blocking error handling for audit logs
    console.error("[audit] Failed to log admin audit:", error);
  }
}
