import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  domainPublishRequests,
  invitationActivityLogs,
  invitations,
  payments,
} from "@/db/schema";
import { buildInvitationUrl, buildSubdomainUrl } from "@/lib/app-url";
import { logAdminAudit } from "@/modules/admin/audit";
import { getAdminSession } from "@/modules/admin/auth";
import {
  getPublicationExpiresAt,
  getPublishRetentionDays,
} from "@/modules/publishing/retention-policy";
import { releaseExpiredPublications } from "@/modules/publishing/retention";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  props: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await props.params;
  const { user, isAuthorized, isSuperAdmin, mustChangePassword } =
    await getAdminSession();

  if (!user || !isAuthorized) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  if (mustChangePassword) {
    return NextResponse.json(
      { error: "Harap ganti kata sandi terlebih dahulu.", mustChangePassword: true },
      { status: 403 }
    );
  }

  if (!isSuperAdmin) {
    return NextResponse.json(
      { error: "Hanya Super Administrator yang dapat mengaktifkan undangan tanpa pembayaran." },
      { status: 403 }
    );
  }

  await releaseExpiredPublications();

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (!invitation) {
    return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });
  }

  if (invitation.status === "archived") {
    return NextResponse.json(
      { error: "Undangan yang diarsipkan tidak dapat diaktifkan." },
      { status: 409 }
    );
  }

  if (invitation.publishMode === "custom_domain") {
    return NextResponse.json(
      { error: "Undangan custom domain harus diproses melalui alur domain." },
      { status: 409 }
    );
  }

  if (invitation.status === "published") {
    const existingUrl =
      invitation.publishMode === "subdomain" && invitation.subdomain
        ? buildSubdomainUrl(invitation.subdomain)
        : invitation.slug
          ? buildInvitationUrl(invitation.slug)
          : null;

    return NextResponse.json({
      ok: true,
      message: "Undangan sudah aktif.",
      invitationId,
      url: existingUrl,
    });
  }

  const [pendingPayment] = await db
    .select({
      id: payments.id,
      mode: payments.mode,
      identifier: payments.identifier,
    })
    .from(payments)
    .where(
      and(
        eq(payments.invitationId, invitationId),
        eq(payments.status, "pending")
      )
    )
    .orderBy(desc(payments.createdAt))
    .limit(1);

  if (!pendingPayment) {
    return NextResponse.json(
      { error: "Aktivasi hanya tersedia untuk undangan yang sedang menunggu pembayaran." },
      { status: 409 }
    );
  }

  if (pendingPayment.mode === "custom_domain") {
    return NextResponse.json(
      { error: "Undangan custom domain harus diproses melalui alur domain." },
      { status: 409 }
    );
  }

  const mode = pendingPayment.mode;
  const identifier = mode === "subdomain" ? invitation.subdomain : invitation.slug;

  if (!identifier) {
    return NextResponse.json(
      { error: "Undangan belum memiliki slug atau subdomain dari proses pembayaran." },
      { status: 409 }
    );
  }

  if (
    invitation.publishMode !== mode ||
    pendingPayment.identifier !== identifier
  ) {
    return NextResponse.json(
      { error: "Alamat undangan tidak sesuai dengan transaksi pembayaran yang aktif." },
      { status: 409 }
    );
  }
  const publishedAt = new Date();
  const retentionDays = getPublishRetentionDays();
  const expiresAt = getPublicationExpiresAt(publishedAt, retentionDays);
  const existingOverrides =
    (invitation.styleOverrides as Record<string, unknown> | null) || {};
  const activityId = randomUUID();

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(invitations)
        .set({
          status: "published",
          publishMode: mode,
          slug: mode === "path" ? identifier : null,
          subdomain: mode === "subdomain" ? identifier : null,
          styleOverrides: {
            ...existingOverrides,
            adminActivation: {
              bypassedPayment: true,
              paymentId: pendingPayment.id,
              activatedAt: publishedAt.toISOString(),
              activatedBy: user.id,
              previousStatus: invitation.status,
              mode,
              identifier,
            },
            publishRetention: expiresAt
              ? {
                  retentionDays,
                  publishedAt: publishedAt.toISOString(),
                  expiresAt: expiresAt.toISOString(),
                }
              : existingOverrides.publishRetention,
          },
          publishedAt,
        })
        .where(eq(invitations.id, invitationId));

      await tx
        .update(domainPublishRequests)
        .set({ status: "cancelled" })
        .where(eq(domainPublishRequests.invitationId, invitationId));

      await tx.insert(invitationActivityLogs).values({
        id: activityId,
        invitationId,
        userId: user.id,
        action: "admin_payment_bypass_activation",
        metadata: {
          ownerUserId: invitation.userId,
          previousStatus: invitation.status,
          mode,
          identifier,
          paymentId: pendingPayment.id,
          publishedAt: publishedAt.toISOString(),
          expiresAt: expiresAt?.toISOString() ?? null,
        },
      });
    });
  } catch (error) {
    console.error("[roots/invitations/activate] Failed to activate invitation:", error);
    return NextResponse.json(
      { error: "Gagal mengaktifkan undangan. Alamat undangan mungkin baru saja digunakan." },
      { status: 409 }
    );
  }

  await logAdminAudit({
    action: "activate_invitation_without_payment",
    actorUserId: user.id,
    targetUserId: invitation.userId,
    request,
    details: {
      invitationId,
      previousStatus: invitation.status,
      mode,
      identifier,
      paymentId: pendingPayment.id,
      activityId,
    },
  });

  const url =
    mode === "subdomain"
      ? buildSubdomainUrl(identifier)
      : buildInvitationUrl(identifier);

  return NextResponse.json({
    ok: true,
    message: "Undangan berhasil diaktifkan tanpa pembayaran.",
    invitationId,
    mode,
    identifier,
    url,
    publishedAt: publishedAt.toISOString(),
    expiresAt: expiresAt?.toISOString() ?? null,
  });
}
