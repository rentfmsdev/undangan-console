import "server-only";
import { cookies } from "next/headers";
import { eq, gt, and, or } from "drizzle-orm";
import { db } from "@/db/client";
import { users, sessions, invitationCollaborators } from "@/db/schema";

export const SESSION_COOKIE_NAME = "undangan_session";
const SESSION_EXPIRY_DAYS = 30;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: "user" | "admin";
};

export async function createSession(userId: string): Promise<string> {
  const sessionToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await db.insert(sessions).values({
    id: sessionToken,
    userId,
    expiresAt,
  });

  return sessionToken;
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionToken));
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) return null;

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
      role: users.role,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionToken))
    .limit(1);

  if (!result.length) return null;

  const session = result[0];
  if (new Date(session.expiresAt) <= new Date()) {
    await deleteSession(sessionToken);
    return null;
  }

  return {
    id: session.id,
    email: session.email,
    name: session.name,
    avatarUrl: session.avatarUrl,
    role: session.role,
  };
}

export async function findOrCreateGoogleUser(payload: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<{ user: AuthUser; sessionToken: string }> {
  const cleanEmail = payload.email.trim().toLowerCase();
  const cleanName = payload.name.trim() || cleanEmail.split("@")[0];

  // 1 Action: Check by googleId or email
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  let userId: string;
  let userRecord: AuthUser;

  if (existingUsers.length > 0) {
    const existing = existingUsers[0];
    userId = existing.id;

    // Update profile info if changed
    await db
      .update(users)
      .set({
        googleId: payload.googleId,
        name: cleanName,
        avatarUrl: payload.avatarUrl ?? existing.avatarUrl,
      })
      .where(eq(users.id, userId));

    userRecord = {
      id: existing.id,
      email: existing.email,
      name: cleanName,
      avatarUrl: payload.avatarUrl ?? existing.avatarUrl,
      role: existing.role,
    };
  } else {
    userId = crypto.randomUUID();
    await db.insert(users).values({
      id: userId,
      email: cleanEmail,
      name: cleanName,
      avatarUrl: payload.avatarUrl ?? null,
      googleId: payload.googleId,
      role: "user",
    });

    userRecord = {
      id: userId,
      email: cleanEmail,
      name: cleanName,
      avatarUrl: payload.avatarUrl ?? null,
      role: "user",
    };
  }

  // Auto-link and accept collaboration invitations for this email upon login
  try {
    await db
      .update(invitationCollaborators)
      .set({
        userId: userId,
        status: "accepted",
        acceptedAt: new Date(),
        lastSeenAt: new Date(),
      })
      .where(
        and(
          eq(invitationCollaborators.email, cleanEmail),
          or(
            eq(invitationCollaborators.status, "pending"),
            eq(invitationCollaborators.status, "accepted")
          )
        )
      );
  } catch {
    // Non-blocking
  }

  const sessionToken = await createSession(userId);

  return {
    user: userRecord,
    sessionToken,
  };
}

