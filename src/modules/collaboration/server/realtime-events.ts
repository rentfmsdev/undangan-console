import "server-only";

import { createClient, type RedisClientType } from "redis";

const CHANNEL = "undangan:collaboration:events";

export type CollaborationRealtimeEvent =
  | { type: "collaborator.revoked"; draftId: string; userId: string }
  | { type: "collaborator.role-changed"; draftId: string; userId: string; role: "editor" | "viewer" };

let publisher: RedisClientType | null = null;
let attemptedConnection = false;

function getRedisOptions() {
  const host = process.env.COLLAB_REDIS_HOST?.trim();
  if (!host) return null;

  const port = Number.parseInt(process.env.COLLAB_REDIS_PORT || "6379", 10);
  const database = Number.parseInt(process.env.COLLAB_REDIS_DATABASE || "0", 10);
  const safePort = Number.isInteger(port) && port > 0 ? port : 6379;
  const reconnectStrategy = (retries: number) => Math.min(1_000 * 2 ** retries, 15_000);
  const socket = process.env.COLLAB_REDIS_TLS === "true"
    ? { host, port: safePort, tls: true as const, reconnectStrategy }
    : { host, port: safePort, reconnectStrategy };
  return {
    database: Number.isInteger(database) && database >= 0 ? database : 0,
    password: process.env.COLLAB_REDIS_PASSWORD || undefined,
    socket: {
      ...socket,
    },
    username: process.env.COLLAB_REDIS_USERNAME || undefined,
  };
}

async function getPublisher() {
  const options = getRedisOptions();
  if (!options) return null;

  if (!publisher) {
    publisher = createClient(options);
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
