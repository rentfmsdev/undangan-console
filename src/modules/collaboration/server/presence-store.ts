import "server-only";

import { CollaborationPresence, PresenceBroadcastEvent } from "../domain/presence";

type ClientSubscriber = {
  connectionId: string;
  userId: string;
  send: (event: PresenceBroadcastEvent) => void;
  close: () => void;
};

type DraftRoom = {
  presences: Map<string, CollaborationPresence>; // connectionId -> Presence
  subscribers: Map<string, ClientSubscriber>; // connectionId -> Subscriber
  cleanupTimer?: NodeJS.Timeout;
};

// Global singleton map to preserve state across hot reloads in dev / server instances
declare global {
  // eslint-disable-next-line no-var
  var __collabPresenceRooms: Map<string, DraftRoom> | undefined;
}

if (!globalThis.__collabPresenceRooms) {
  globalThis.__collabPresenceRooms = new Map();
}

const rooms = globalThis.__collabPresenceRooms;

function getOrCreateRoom(draftId: string): DraftRoom {
  let room = rooms.get(draftId);
  if (!room) {
    room = {
      presences: new Map(),
      subscribers: new Map(),
    };
    rooms.set(draftId, room);
  }
  return room;
}

// Heartbeat expiry threshold: 30 seconds
const STALE_THRESHOLD_MS = 30_000;

function cleanupStaleConnections(draftId: string) {
  const room = rooms.get(draftId);
  if (!room) return;

  const now = Date.now();
  const deadConnectionIds: string[] = [];

  for (const [connId, pres] of room.presences.entries()) {
    if (now - pres.lastSeenAt > STALE_THRESHOLD_MS) {
      deadConnectionIds.push(connId);
    }
  }

  for (const connId of deadConnectionIds) {
    const pres = room.presences.get(connId);
    room.presences.delete(connId);
    const sub = room.subscribers.get(connId);
    if (sub) {
      sub.close();
      room.subscribers.delete(connId);
    }
    if (pres) {
      broadcastToRoom(draftId, {
        type: "leave",
        connectionId: connId,
        userId: pres.userId,
      });
    }
  }

  if (room.presences.size === 0 && room.subscribers.size === 0) {
    rooms.delete(draftId);
  }
}

export function subscribeToPresenceRoom(
  draftId: string,
  subscriber: ClientSubscriber
) {
  const room = getOrCreateRoom(draftId);
  room.subscribers.set(subscriber.connectionId, subscriber);

  // Send immediate sync snapshot of current online members in the room
  const currentPresences = Array.from(room.presences.values());
  subscriber.send({
    type: "sync",
    presences: currentPresences,
  });

  return () => {
    unsubscribeFromPresenceRoom(draftId, subscriber.connectionId);
  };
}

export function unsubscribeFromPresenceRoom(
  draftId: string,
  connectionId: string
) {
  const room = rooms.get(draftId);
  if (!room) return;

  const pres = room.presences.get(connectionId);
  room.presences.delete(connectionId);
  room.subscribers.delete(connectionId);

  if (pres) {
    broadcastToRoom(draftId, {
      type: "leave",
      connectionId,
      userId: pres.userId,
    });
  }

  if (room.presences.size === 0 && room.subscribers.size === 0) {
    rooms.delete(draftId);
  }
}

export function recordPresenceHeartbeat(
  draftId: string,
  presence: Omit<CollaborationPresence, "lastSeenAt">
): CollaborationPresence {
  const room = getOrCreateRoom(draftId);
  cleanupStaleConnections(draftId);

  const isNew = !room.presences.has(presence.connectionId);
  const fullPresence: CollaborationPresence = {
    ...presence,
    lastSeenAt: Date.now(),
  };

  room.presences.set(presence.connectionId, fullPresence);

  broadcastToRoom(draftId, {
    type: isNew ? "join" : "update",
    presence: fullPresence,
  });

  return fullPresence;
}

export function broadcastToRoom(
  draftId: string,
  event: PresenceBroadcastEvent
) {
  const room = rooms.get(draftId);
  if (!room) return;

  for (const sub of room.subscribers.values()) {
    try {
      sub.send(event);
    } catch {
      // Ignore broken pipe
    }
  }
}

export function broadcastRevokeToUser(draftId: string, targetUserId: string) {
  const room = rooms.get(draftId);
  if (!room) return;

  broadcastToRoom(draftId, {
    type: "revoked",
    userId: targetUserId,
    reason: "Akses kolaborasi Anda telah dicabut oleh pemilik.",
  });

  // Disconnect any active connections for this user
  for (const [connId, pres] of Array.from(room.presences.entries())) {
    if (pres.userId === targetUserId) {
      room.presences.delete(connId);
      const sub = room.subscribers.get(connId);
      if (sub) {
        sub.close();
        room.subscribers.delete(connId);
      }
    }
  }
}

export function getOnlinePresences(draftId: string): CollaborationPresence[] {
  const room = rooms.get(draftId);
  if (!room) return [];
  cleanupStaleConnections(draftId);
  return Array.from(room.presences.values());
}
