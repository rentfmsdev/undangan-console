import "server-only";

import { cookies } from "next/headers";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationCollaborators, invitations } from "@/db/schema";
import { getSessionUser } from "@/modules/auth/service";
import { editCookieName, isMatchingSecret } from "@/modules/anonymous-access/token";

export type DraftAccessRole = "owner" | "editor" | "viewer" | "anonymous";

export async function getDraftAccess(draftId: string) {
  const [draft] = await db.select().from(invitations).where(eq(invitations.id, draftId)).limit(1);
  if (!draft) return { draft: null, user: await getSessionUser(), authorized: false, role: null, ownedByUser: false };
  const user = await getSessionUser();
  const ownedByUser = Boolean(user && draft.userId === user.id);

  let isCollaborator = false;
  let collaboratorRole: "editor" | "viewer" = "editor";

  if (user && !ownedByUser) {
    const [collab] = await db
      .select()
      .from(invitationCollaborators)
      .where(
        and(
          eq(invitationCollaborators.invitationId, draftId),
          or(
            eq(invitationCollaborators.userId, user.id),
            eq(invitationCollaborators.email, user.email)
          )
        )
      )
      .limit(1);

    // A collaboration invitation grants access only after the recipient explicitly
    // accepts it through the token flow. Do not turn a pending invitation into an
    // implicit editor session merely because the account email happens to match.
    if (collab && collab.status === "accepted") {
      isCollaborator = true;
      collaboratorRole = collab.role;
      // This is informational only; failed presence bookkeeping must never
      // downgrade a valid collaborator's access.
      await db
        .update(invitationCollaborators)
        .set({ lastSeenAt: new Date() })
        .where(eq(invitationCollaborators.id, collab.id))
        .catch(() => {});
    }
  }

  const editToken = (await cookies()).get(editCookieName(draftId))?.value;
  const authorizedByToken = !draft.userId && isMatchingSecret(editToken, draft.editTokenHash);

  const role: DraftAccessRole = ownedByUser
    ? "owner"
    : isCollaborator
    ? collaboratorRole
    : authorizedByToken
    ? "anonymous"
    : "viewer";

  return {
    draft,
    user,
    authorized: ownedByUser || isCollaborator || authorizedByToken,
    ownedByUser,
    isCollaborator,
    role,
  };
}
