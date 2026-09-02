import "server-only";

import crypto from "crypto";
import { db } from "@/db/client";
import { emailOutbox, invitationActivityLogs } from "@/db/schema";

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

export async function logInvitationActivity({
  invitationId,
  userId,
  action,
  metadata,
}: {
  invitationId: string;
  userId: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(invitationActivityLogs).values({
      id: crypto.randomUUID(),
      invitationId,
      userId,
      action,
      metadata: metadata ?? null,
    });
  } catch (err) {
    console.error("Failed to log invitation activity:", err);
  }
}

export async function queueOutboxEmail({
  type,
  recipient,
  payload,
}: {
  type: string;
  recipient: string;
  payload: Record<string, unknown>;
}) {
  try {
    await db.insert(emailOutbox).values({
      id: crypto.randomUUID(),
      type,
      recipient: recipient.toLowerCase().trim(),
      payload,
      status: "pending",
      attempts: 0,
    });
  } catch (err) {
    console.error("Failed to queue email outbox:", err);
  }
}
