"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CollaborationPresence, RemoteCursor, getDeterministicUserColor } from "../domain/presence";

type CurrentUserProps = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
} | null;

type UsePresenceOptions = {
  draftId?: string | null;
  enabled?: boolean;
  currentUser?: CurrentUserProps;
  role?: "owner" | "editor" | "viewer";
  onRevoked?: () => void;
};

export function usePresence({
  draftId,
  enabled = true,
  currentUser,
  role = "editor",
  onRevoked,
}: UsePresenceOptions) {
  const router = useRouter();
  const [onlinePresences, setOnlinePresences] = useState<CollaborationPresence[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");

  const socketRef = useRef<WebSocket | null>(null);
  const connectionIdRef = useRef<string>("");
  const isIdleRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const lastCursorSentRef = useRef(0);

  // Store user & role in stable refs to avoid tearing down WebSocket on re-renders
  const userRef = useRef(currentUser);
  userRef.current = currentUser;

  const roleRef = useRef(role);
  roleRef.current = role;

  const onRevokedRef = useRef(onRevoked);
  onRevokedRef.current = onRevoked;

  const activeSurfaceRef = useRef<{
    surface?: "canvas" | "preview" | "left-sidebar" | "right-sidebar";
    sectionId?: string | null;
    fieldPath?: string | null;
  }>({});

  // Initialize persistent connectionId per browser tab
  if (!connectionIdRef.current && typeof window !== "undefined") {
    let saved = window.sessionStorage.getItem(`collab_conn_${draftId || "default"}`);
    if (!saved) {
      saved = crypto.randomUUID();
      window.sessionStorage.setItem(`collab_conn_${draftId || "default"}`, saved);
    }
    connectionIdRef.current = saved;
  }

  // Construct current presence payload safely
  const buildCurrentPresence = useCallback((state: "active" | "idle" = "active"): CollaborationPresence => {
    const user = userRef.current;
    return {
      connectionId: connectionIdRef.current,
      userId: user?.id ?? "anonymous",
      name: user?.name ?? "User",
      email: user?.email ?? "",
      avatarUrl: user?.avatarUrl ?? null,
      color: user ? getDeterministicUserColor(user.id) : "#10B981",
      role: roleRef.current,
      state,
      surface: activeSurfaceRef.current.surface,
      sectionId: activeSurfaceRef.current.sectionId,
      fieldPath: activeSurfaceRef.current.fieldPath,
      lastSeenAt: Date.now(),
    };
  }, []);

  const currentUserId = currentUser?.id;

  // Single WebSocket connection lifecycle
  useEffect(() => {
    if (!enabled || !draftId || !currentUserId) {
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
      setConnectionStatus("disconnected");
      setOnlinePresences([]);
      setRemoteCursors([]);
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isDisposed = false;

    function connect() {
      if (isDisposed) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname || "localhost";
      const wsUrl = `${protocol}//${host}:3001?draftId=${encodeURIComponent(draftId!)}&connectionId=${encodeURIComponent(connectionIdRef.current)}`;

      try {
        setConnectionStatus("connecting");
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (isDisposed) return;
          setConnectionStatus("connected");

          // Send join message
          ws?.send(JSON.stringify({
            type: "join",
            draftId,
            presence: buildCurrentPresence("active"),
          }));
        };

        ws.onmessage = (event) => {
          if (isDisposed) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === "sync" && Array.isArray(data.presences)) {
              setOnlinePresences(data.presences);
            } else if (data.type === "join" || data.type === "update") {
              setOnlinePresences((prev) => {
                const map = new Map(prev.map((p) => [p.connectionId, p]));
                map.set(data.presence.connectionId, data.presence);
                return Array.from(map.values());
              });
            } else if (data.type === "cursor") {
              // Ignore own cursor reflections
              if (data.connectionId !== connectionIdRef.current) {
                setRemoteCursors((prev) => {
                  const map = new Map(prev.map((c) => [c.connectionId, c]));
                  map.set(data.connectionId, {
                    connectionId: data.connectionId,
                    userId: data.userId,
                    name: data.cursor.name,
                    color: data.cursor.color,
                    surface: data.cursor.surface,
                    x: data.cursor.x,
                    y: data.cursor.y,
                    sectionId: data.cursor.sectionId ?? null,
                    fieldPath: data.cursor.fieldPath ?? null,
                    updatedAt: data.updatedAt || Date.now(),
                  });
                  return Array.from(map.values());
                });
              }
            } else if (data.type === "leave") {
              setOnlinePresences((prev) => prev.filter((p) => p.connectionId !== data.connectionId));
              setRemoteCursors((prev) => prev.filter((c) => c.connectionId !== data.connectionId));
            } else if (data.type === "revoked") {
              if (data.userId === currentUserId) {
                setConnectionStatus("disconnected");
                if (onRevokedRef.current) {
                  onRevokedRef.current();
                } else {
                  alert("Akses kolaborasi Anda untuk undangan ini telah dicabut oleh pemilik.");
                  router.push("/");
                }
              }
            }
          } catch {}
        };

        ws.onclose = () => {
          if (isDisposed) return;
          setConnectionStatus("disconnected");
          socketRef.current = null;
          if (!isDisposed) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          if (isDisposed) return;
          setConnectionStatus("error");
          ws?.close();
        };
      } catch {
        if (!isDisposed) {
          setConnectionStatus("error");
          reconnectTimeout = setTimeout(connect, 4000);
        }
      }
    }

    connect();

    // Periodic cleanup of stale cursors (> 4s without movement)
    const cursorPruner = setInterval(() => {
      const now = Date.now();
      setRemoteCursors((prev) => prev.filter((c) => now - c.updatedAt < 4000));
    }, 1000);

    return () => {
      isDisposed = true;
      clearInterval(cursorPruner);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
        socketRef.current = null;
      }
    };
  }, [enabled, draftId, currentUserId, buildCurrentPresence, router]);

  // Handle User Activity (Idle Detection)
  useEffect(() => {
    if (!enabled || !draftId || !currentUserId) return;

    function handleActivity() {
      lastActivityRef.current = Date.now();
      if (isIdleRef.current) {
        isIdleRef.current = false;
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "presence.update",
            presence: buildCurrentPresence("active"),
          }));
        }
      }
    }

    const events = ["pointerdown", "keydown", "wheel", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    const idleChecker = setInterval(() => {
      if (!isIdleRef.current && Date.now() - lastActivityRef.current > 30_000) {
        isIdleRef.current = true;
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "presence.update",
            presence: buildCurrentPresence("idle"),
          }));
        }
      }
    }, 5_000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      clearInterval(idleChecker);
    };
  }, [enabled, draftId, currentUserId, buildCurrentPresence]);

  // Method to broadcast cursor movement (throttled to 40ms)
  const broadcastCursor = useCallback((params: {
    surface: "canvas" | "preview" | "left-sidebar" | "right-sidebar";
    x: number;
    y: number;
    sectionId?: string | null;
    fieldPath?: string | null;
  }) => {
    const now = Date.now();
    if (now - lastCursorSentRef.current < 40) return; // 40ms throttle
    lastCursorSentRef.current = now;

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const user = userRef.current;
      socketRef.current.send(JSON.stringify({
        type: "cursor",
        cursor: {
          name: user?.name ?? "User",
          color: user ? getDeterministicUserColor(user.id) : "#10B981",
          surface: params.surface,
          x: params.x,
          y: params.y,
          sectionId: params.sectionId ?? activeSurfaceRef.current.sectionId,
          fieldPath: params.fieldPath ?? activeSurfaceRef.current.fieldPath,
        },
      }));
    }
  }, []);

  // Method to report active surface / section (without cursor move)
  const updateActiveSurface = useCallback((params: {
    surface?: "canvas" | "preview" | "left-sidebar" | "right-sidebar";
    sectionId?: string | null;
    fieldPath?: string | null;
  }) => {
    activeSurfaceRef.current = {
      ...activeSurfaceRef.current,
      ...params,
    };
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "presence.update",
        presence: buildCurrentPresence(isIdleRef.current ? "idle" : "active"),
      }));
    }
  }, [buildCurrentPresence]);

  // Deduplicate online users by userId
  const uniqueOnlineUsers = useMemo(() => {
    const userMap = new Map<string, CollaborationPresence>();
    for (const p of onlinePresences) {
      const existing = userMap.get(p.userId);
      if (!existing || (existing.state === "idle" && p.state === "active")) {
        userMap.set(p.userId, p);
      }
    }
    return Array.from(userMap.values());
  }, [onlinePresences]);

  return {
    connectionStatus,
    allPresences: onlinePresences,
    onlineUsers: uniqueOnlineUsers,
    onlineCount: uniqueOnlineUsers.length,
    remoteCursors,
    broadcastCursor,
    updateActiveSurface,
  };
}
