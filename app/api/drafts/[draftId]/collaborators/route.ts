import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationCollaborators, invitations, users } from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";
import { generateInviteToken, hashInviteToken, logInvitationActivity, queueOutboxEmail } from "@/modules/collaboration/invitation";
import { getAppBaseUrl } from "@/modules/auth/oauth-state";
import { z } from "zod";
import crypto from "crypto";

const inviteSchema = z.object({
  email: z.string().email("Format email tidak valid").toLowerCase().trim(),
  role: z.enum(["editor", "viewer"]).optional().default("editor"),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const access = await getDraftAccess(draftId);

  if (!access.authorized || !access.draft) {
    return NextResponse.json({ error: "Draft tidak dapat diakses." }, { status: 401 });
  }

  // Get Owner details
  let owner = null;
  if (access.draft.userId) {
    const [ownerRecord] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, access.draft.userId))
      .limit(1);
    owner = ownerRecord;
  }

  // Get all active / pending collaborators (never expose token hashes in GET!)
  const collabRecords = await db
    .select({
      id: invitationCollaborators.id,
      email: invitationCollaborators.email,
      role: invitationCollaborators.role,
      status: invitationCollaborators.status,
      expiresAt: invitationCollaborators.expiresAt,
      acceptedAt: invitationCollaborators.acceptedAt,
      createdAt: invitationCollaborators.createdAt,
      userId: invitationCollaborators.userId,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(invitationCollaborators)
    .leftJoin(users, eq(invitationCollaborators.userId, users.id))
    .where(eq(invitationCollaborators.invitationId, draftId));

  const collaborators = collabRecords.map((c) => ({
    id: c.id,
    email: c.email,
    role: c.role,
    status: c.status,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    acceptedAt: c.acceptedAt ? c.acceptedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    user: c.userId
      ? {
          id: c.userId,
          name: c.userName ?? c.email,
          avatarUrl: c.userAvatar,
        }
      : null,
  }));

  return NextResponse.json({
    owner,
    collaborators,
    isOwner: access.ownedByUser,
    currentRole: access.role,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const access = await getDraftAccess(draftId);

  if (!access.authorized || !access.draft || !access.user) {
    return NextResponse.json(
      { error: "Silakan masuk dengan akun Google untuk mengundang kolaborator." },
      { status: 401 }
    );
  }

  if (!access.ownedByUser && access.role !== "owner") {
    return NextResponse.json(
      { error: "Hanya pemilik (owner) undangan yang dapat mengundang kolaborator." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Input tidak valid." },
      { status: 400 }
    );
  }

  const { email, role } = parsed.data;

  // Cannot invite oneself
  if (email === access.user.email.toLowerCase().trim()) {
    return NextResponse.json(
      { error: "Anda adalah pemilik undangan ini." },
      { status: 400 }
    );
  }

  // Check if target user exists in users table
  const [existingUser] = await db
    .select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Generate secure raw token (sent only once) & hash for DB storage
  const rawToken = generateInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Check existing collaboration record
  const [existingCollab] = await db
    .select()
    .from(invitationCollaborators)
    .where(
      and(
        eq(invitationCollaborators.invitationId, draftId),
        eq(invitationCollaborators.email, email)
      )
    )
    .limit(1);

  const newId = existingCollab ? existingCollab.id : crypto.randomUUID();

  // Existing users still need to explicitly accept the invitation. Otherwise an
  // owner could silently grant a logged-in account access to a private draft.
  const initialStatus = "pending" as const;
  const acceptedAt = null;

  if (existingCollab) {
    await db
      .update(invitationCollaborators)
      .set({
        role,
        inviteTokenHash: tokenHash,
        expiresAt,
        status: initialStatus,
        userId: existingUser?.id ?? existingCollab.userId,
        acceptedAt: acceptedAt ?? existingCollab.acceptedAt,
        declinedAt: null,
        revokedAt: null,
      })
      .where(eq(invitationCollaborators.id, existingCollab.id));
  } else {
    await db.insert(invitationCollaborators).values({
      id: newId,
      invitationId: draftId,
      email,
      role,
      inviteTokenHash: tokenHash,
      status: initialStatus,
      expiresAt,
      acceptedAt,
      userId: existingUser?.id ?? null,
      invitedBy: access.user.id,
    });
  }

  // Activity Log
  await logInvitationActivity({
    invitationId: draftId,
    userId: access.user.id,
    action: "invited",
    metadata: { recipientEmail: email, role, expiresAt: expiresAt.toISOString() },
  });

  // Email Outbox
  const origin = getAppBaseUrl(request);
  const inviteUrl = `${origin}/collaboration/invite/${rawToken}`;
  await queueOutboxEmail({
    type: "collaboration_invite",
    recipient: email,
    payload: {
      draftTitle: access.draft.title,
      inviterName: access.user.name,
      role,
      inviteUrl,
      expiresAt: expiresAt.toISOString(),
    },
  });

  return NextResponse.json({
    ok: true,
    message: `Undangan kolaborasi berhasil dibuat untuk ${email}!`,
    inviteUrl,
    collaborator: {
      id: newId,
      email,
      role,
      status: initialStatus,
      expiresAt: expiresAt.toISOString(),
      user: existingUser ?? null,
    },
  });
}
