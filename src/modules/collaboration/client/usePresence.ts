"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CollaborationPresence, getDeterministicUserColor } from "../domain/presence";

type UsePresenceOptions = {
  draftId?: string;
  enabled?: boolean;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
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
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");

  const socketRef = useRef<WebSocket | null>(null);
  const connectionIdRef = useRef<string>("");
  const isIdleRef = useRef(false);
  const lastActivityRef = useRef(Date.now());

  // Initialize persistent connectionId per browser tab
  if (!connectionIdRef.current && typeof window !== "undefined") {
    let saved = window.sessionStorage.getItem(`collab_conn_${draftId}`);
    if (!saved) {
      saved = crypto.randomUUID();
      window.sessionStorage.setItem(`collab_conn_${draftId}`, saved);
    }
    connectionIdRef.current = saved;
  }

  // Get current user presence payload
  const getMyPresence = useCallback((state: "active" | "idle" = "active"): CollaborationPresence => {
    return {
      connectionId: connectionIdRef.current,
      userId: currentUser?.id ?? "anonymous",
      name: currentUser?.name ?? "User",
      email: currentUser?.email ?? "",
      avatarUrl: currentUser?.avatarUrl ?? null,
      color: currentUser ? getDeterministicUserColor(currentUser.id) : "#10B981",
      role,
      state,
      lastSeenAt: Date.now(),
    };
  }, [currentUser, role]);

  // WebSocket lifecycle (single persistent connection, 0 HTTP fetch)
  useEffect(() => {
    if (!enabled || !draftId || !currentUser) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setConnectionStatus("disconnected");
      setOnlinePresences([]);
      return;
    }

    setConnectionStatus("connecting");
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname || "localhost";
      const wsUrl = `${protocol}//${host}:3001?draftId=${encodeURIComponent(draftId!)}&connectionId=${encodeURIComponent(connectionIdRef.current)}`;

      try {
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          setConnectionStatus("connected");

          // Send join message with current presence
          ws?.send(JSON.stringify({
            type: "join",
            draftId,
            presence: getMyPresence("active"),
          }));
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
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
            } else if (data.type === "leave") {
              setOnlinePresences((prev) => prev.filter((p) => p.connectionId !== data.connectionId));
            } else if (data.type === "revoked") {
              if (data.userId === currentUser.id) {
                setConnectionStatus("disconnected");
                if (onRevoked) onRevoked();
                else {
                  alert("Akses kolaborasi Anda untuk undangan ini telah dicabut oleh pemilik.");
                  router.push("/");
                }
              }
            }
          } catch {}
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setConnectionStatus("disconnected");
          socketRef.current = null;
          // Reconnect after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          if (isUnmounted) return;
          setConnectionStatus("error");
          ws?.close();
        };
      } catch {
        setConnectionStatus("error");
        reconnectTimeout = setTimeout(connect, 4000);
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
        socketRef.current = null;
      }
    };
  }, [enabled, draftId, currentUser?.id, getMyPresence, onRevoked, router]);

  // Handle User Activity (Idle Detection without network spam)
  useEffect(() => {
    if (!enabled || !draftId || !currentUser) return;

    function handleActivity() {
      lastActivityRef.current = Date.now();
      if (isIdleRef.current) {
        isIdleRef.current = false;
        // Only notify WebSocket when transitioning from idle -> active
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "presence.update",
            presence: getMyPresence("active"),
          }));
        }
      }
    }

    const events = ["pointerdown", "keydown", "wheel", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    const idleChecker = setInterval(() => {
      if (!isIdleRef.current && Date.now() - lastActivityRef.current > 30_000) {
        isIdleRef.current = true;
        // Only notify WebSocket when transitioning from active -> idle
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "presence.update",
            presence: getMyPresence("idle"),
          }));
        }
      }
    }, 5_000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      clearInterval(idleChecker);
    };
  }, [enabled, draftId, currentUser, getMyPresence]);

  // Method to report active editing section (sent over WebSocket)
  const updateActiveSurface = useCallback((params: {
    surface?: "canvas" | "preview" | "left-sidebar" | "right-sidebar";
    sectionId?: string | null;
    fieldPath?: string | null;
  }) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const p = getMyPresence(isIdleRef.current ? "idle" : "active");
      socketRef.current.send(JSON.stringify({
        type: "presence.update",
        presence: {
          ...p,
          ...params,
        },
      }));
    }
  }, [getMyPresence]);

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
    updateActiveSurface,
  };
}
