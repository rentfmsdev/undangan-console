import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { domainPublishRequests, invitationActivityLogs, invitations, payments } from "@/db/schema";
import { getPublicationExpiresAt, getPublishRetentionDays } from "@/modules/publishing/retention-policy";

export const runtime = "nodejs";

interface PaymentCallbackPayload {
  client_reference_id: string;
  status: string;
  amount: number;
  currency: string;
  paid_at: string;
  metadata?: {
    draftId?: string;
    invitationId?: string;
    mode?: "path" | "subdomain" | "custom_domain";
    identifier?: string;
    userId?: string;
    [key: string]: unknown;
  };
}

export async function POST(request: Request) {
  const secret = process.env.PAYMENT_CALLBACK_SECRET;
  if (secret) {
    const incomingSecret = request.headers.get("X-Callback-Secret");
    if (incomingSecret !== secret) {
      console.warn("⚠️ [Payment Callback] Unauthorized: Invalid X-Callback-Secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: PaymentCallbackPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { client_reference_id, status, amount, currency, paid_at, metadata } = payload;
  console.log(`📨 [Payment Callback] Received for ${client_reference_id}, status=${status}`);

  if (status !== "paid" && status !== "completed") {
    console.log(`ℹ️ [Payment Callback] Ignoring non-paid status: ${status}`);
    return NextResponse.json({ ok: true, message: `Ignored status: ${status}` });
  }

  // 1. Look up payment in `payments` table
  let paymentRecord = null;
  if (client_reference_id) {
    const [p] = await db
      .select()
      .from(payments)
      .where(eq(payments.referenceId, client_reference_id))
      .limit(1);
    paymentRecord = p;
  }

  const targetId = metadata?.draftId || metadata?.invitationId || paymentRecord?.invitationId;
  if (!targetId) {
    console.error("❌ [Payment Callback] Missing draftId or invitationId in metadata/payment", metadata);
    return NextResponse.json({ error: "Missing draftId or invitationId in metadata" }, { status: 400 });
  }

  if (!paymentRecord) {
    const [p] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.invitationId, targetId), eq(payments.status, "pending")))
      .orderBy(desc(payments.createdAt))
      .limit(1);
    paymentRecord = p;
  }

  const publishedAt = paid_at ? new Date(paid_at) : new Date();

  // Update payments row to 'paid'
  if (paymentRecord) {
    await db
      .update(payments)
      .set({
        status: "paid",
        paidAt: publishedAt,
        referenceId: client_reference_id || paymentRecord.referenceId,
        amount: amount || paymentRecord.amount,
      })
      .where(eq(payments.id, paymentRecord.id));
  }

  const [draft] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, targetId))
    .limit(1);

  if (!draft) {
    console.error(`❌ [Payment Callback] Invitation not found: ${targetId}`);
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  // Strictly preserve user intention: metadata -> payments record -> draft.publishMode
  const mode = metadata?.mode || paymentRecord?.mode || draft.publishMode || "path";
  const identifier =
    metadata?.identifier ||
    paymentRecord?.identifier ||
    (mode === "subdomain" ? draft.subdomain : draft.slug) ||
    draft.slug ||
    draft.subdomain ||
    "undangan";

  const retentionDays = getPublishRetentionDays();
  const expiresAt = getPublicationExpiresAt(publishedAt, retentionDays);

  const existingOverrides = (draft.styleOverrides as Record<string, unknown>) || {};
  const updatedOverrides = {
    ...existingOverrides,
    publishPricing: {
      total: amount || paymentRecord?.amount || 0,
      pricingStatus: "paid",
      paidAt: publishedAt.toISOString(),
      referenceId: client_reference_id,
    },
    publishRetention: expiresAt
      ? {
          retentionDays,
          publishedAt: publishedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        }
      : existingOverrides.publishRetention,
    payment: {
      provider: "pivot",
      clientReferenceId: client_reference_id,
      amount: amount || paymentRecord?.amount || 0,
      currency: currency || "IDR",
      paidAt: publishedAt.toISOString(),
      status: "paid",
    },
  };

  if (mode === "path") {
    await db
      .update(invitations)
      .set({
        status: "published",
        publishMode: "path",
        slug: identifier,
        subdomain: null,
        styleOverrides: updatedOverrides,
        publishedAt,
      })
      .where(eq(invitations.id, targetId));

    await db
      .update(domainPublishRequests)
      .set({ status: "cancelled" })
      .where(eq(domainPublishRequests.invitationId, targetId));
  } else if (mode === "subdomain") {
    await db
      .update(invitations)
      .set({
        status: "published",
        publishMode: "subdomain",
        subdomain: identifier,
        slug: null,
        styleOverrides: updatedOverrides,
        publishedAt,
      })
      .where(eq(invitations.id, targetId));

    await db
      .update(domainPublishRequests)
      .set({ status: "cancelled" })
      .where(eq(domainPublishRequests.invitationId, targetId));
  } else if (mode === "custom_domain") {
    await db
      .update(invitations)
      .set({
        status: "custom",
        publishMode: "custom_domain",
        styleOverrides: updatedOverrides,
      })
      .where(eq(invitations.id, targetId));

    await db
      .update(domainPublishRequests)
      .set({ status: "processing" })
      .where(eq(domainPublishRequests.invitationId, targetId));
  }

  // Record activity log
  try {
    await db.insert(invitationActivityLogs).values({
      id: randomUUID(),
      invitationId: targetId,
      userId: draft.userId || null,
      action: "payment_completed",
      metadata: {
        clientReferenceId: client_reference_id,
        amount,
        currency,
        paidAt: publishedAt.toISOString(),
        mode,
        identifier,
      },
    });
  } catch (logErr) {
    console.warn("⚠️ [Payment Callback] Failed to write activity log:", logErr);
  }

  console.log(`✅ [Payment Callback] Successfully processed payment for invitation ${targetId} (${mode})`);
  return NextResponse.json({
    ok: true,
    message: "Payment processed and invitation activated successfully",
    invitationId: targetId,
    mode,
  });
}
