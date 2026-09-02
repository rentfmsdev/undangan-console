import "server-only";

import { createClient, type RedisClientType } from "redis";

const CHANNEL = "undangan:collaboration:events";

export type CollaborationRealtimeEvent =
  | { type: "collaborator.revoked"; draftId: string; userId: string }
  | { type: "collaborator.role-changed"; draftId: string; userId: string; role: "editor" | "viewer" };

let publisher: RedisClientType | null = null;
let attemptedConnection = false;

function getRedisUrl() {
  return process.env.COLLAB_REDIS_URL?.trim();
}

async function getPublisher() {
  const url = getRedisUrl();
  if (!url) return null;

  if (!publisher) {
    publisher = createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => Math.min(1_000 * 2 ** retries, 15_000),
      },
    });
    publisher.on("error", (error) => {
      console.warn("[Collaboration Redis] Publisher unavailable; database access checks remain active.", error.message);
    });
  }

  if (!publisher.isOpen && !attemptedConnection) {
    attemptedConnection = true;
    try {
      await publisher.connect();
    } catch (error) {
      attemptedConnection = false;
      console.warn("[Collaboration Redis] Cannot connect; continuing without pub/sub.", error instanceof Error ? error.message : error);
      return null;
    }
  }

  return publisher.isOpen ? publisher : null;
}

/**
 * Best-effort cross-instance notification. A failed Redis operation must never
 * block role/revoke mutations: the collaboration WebSocket still validates
 * membership against MySQL before every write and on its fallback interval.
 */
export async function publishCollaborationRealtimeEvent(event: CollaborationRealtimeEvent) {
  try {
    const client = await getPublisher();
    if (!client) return false;
    await client.publish(CHANNEL, JSON.stringify(event));
    return true;
  } catch (error) {
    console.warn("[Collaboration Redis] Publish failed; using MySQL fallback.", error instanceof Error ? error.message : error);
    return false;
  }
}

