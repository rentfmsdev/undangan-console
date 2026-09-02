import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationCollaborators, invitations, users } from "@/db/schema";
import { getDraftAccess } from "@/modules/drafts/access";
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

  // Get all collaborators with linked user info
  const collabRecords = await db
    .select({
      id: invitationCollaborators.id,
      email: invitationCollaborators.email,
      role: invitationCollaborators.role,
      status: invitationCollaborators.status,
      inviteToken: invitationCollaborators.inviteToken,
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
    inviteToken: c.inviteToken,
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

  // Check if target user already exists in users table
  const [existingUser] = await db
    .select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const inviteToken = crypto.randomBytes(24).toString("hex");

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

  if (existingCollab) {
    // Update existing
    await db
      .update(invitationCollaborators)
      .set({
        role,
        userId: existingUser?.id ?? existingCollab.userId,
        status: existingUser ? "accepted" : existingCollab.status,
      })
      .where(eq(invitationCollaborators.id, existingCollab.id));

    return NextResponse.json({
      ok: true,
      message: `Peran untuk ${email} diperbarui menjadi ${role}.`,
    });
  }

  const newId = crypto.randomUUID();
  await db.insert(invitationCollaborators).values({
    id: newId,
    invitationId: draftId,
    email,
    role,
    inviteToken,
    userId: existingUser?.id ?? null,
    status: existingUser ? "accepted" : "pending",
    invitedBy: access.user.id,
  });

  return NextResponse.json({
    ok: true,
    message: `Undangan kolaborasi berhasil dikirim ke ${email}!`,
    collaborator: {
      id: newId,
      email,
      role,
      status: existingUser ? "accepted" : "pending",
      user: existingUser ?? null,
    },
  });
}
