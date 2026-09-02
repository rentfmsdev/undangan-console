import { NextResponse } from "next/server";
import { getDraftAccess } from "@/modules/drafts/access";
import { recordPresenceHeartbeat, getOnlinePresences } from "@/modules/collaboration/server/presence-store";
import { getDeterministicUserColor } from "@/modules/collaboration/domain/presence";
import { z } from "zod";

const presenceHeartbeatSchema = z.object({
  connectionId: z.string().min(8),
  state: z.enum(["active", "idle"]).default("active"),
  surface: z.enum(["canvas", "preview", "left-sidebar", "right-sidebar"]).optional(),
  sectionId: z.string().nullable().optional(),
  fieldPath: z.string().nullable().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const access = await getDraftAccess(draftId);

  if (!access.authorized || !access.user) {
    return NextResponse.json({ ok: false, isRevoked: true, error: "Akses ditolak atau dicabut." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = presenceHeartbeatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { connectionId, state, surface, sectionId, fieldPath } = parsed.data;
  const role = access.ownedByUser ? "owner" : (access.role as "editor" | "viewer");
  const color = getDeterministicUserColor(access.user.id);

  recordPresenceHeartbeat(draftId, {
    connectionId,
    userId: access.user.id,
    name: access.user.name,
    email: access.user.email,
    avatarUrl: access.user.avatarUrl ?? null,
    color,
    role,
    state,
    surface,
    sectionId: sectionId ?? null,
    fieldPath: fieldPath ?? null,
  });

  const onlinePresences = getOnlinePresences(draftId);

  return NextResponse.json({
    ok: true,
    isRevoked: false,
    onlineUsers: onlinePresences,
  });
}
