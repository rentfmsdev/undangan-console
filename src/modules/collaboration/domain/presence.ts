export type UserRole = "owner" | "editor" | "viewer";

export type CollaborationPresence = {
  connectionId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  color: string;
  role: UserRole;
  state: "active" | "idle";
  surface?: "canvas" | "preview" | "left-sidebar" | "right-sidebar";
  sectionId?: string | null;
  fieldPath?: string | null;
  lastSeenAt: number;
};

export type RemoteCursor = {
  connectionId: string;
  userId: string;
  name: string;
  color: string;
  surface: "canvas" | "preview" | "left-sidebar" | "right-sidebar";
  x: number;
  y: number;
  sectionId?: string | null;
  fieldPath?: string | null;
  updatedAt: number;
};

export type PresenceBroadcastEvent =
  | { type: "sync"; presences: CollaborationPresence[] }
  | { type: "join"; presence: CollaborationPresence }
  | { type: "update"; presence: CollaborationPresence }
  | { type: "cursor"; connectionId: string; userId: string; cursor: RemoteCursor }
  | { type: "leave"; connectionId: string; userId: string }
  | { type: "revoked"; userId: string; reason?: string };

// Deterministic pastel color generator for avatar rings and future cursors
const COLLAB_COLORS = [
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#6366F1", // Indigo
];

export function getDeterministicUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COLLAB_COLORS.length;
  return COLLAB_COLORS[index]!;
}
