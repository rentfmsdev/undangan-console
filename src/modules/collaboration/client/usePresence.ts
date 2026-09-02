"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CollaborationPresence } from "../domain/presence";

type UsePresenceOptions = {
  draftId?: string;
  enabled?: boolean;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  onRevoked?: () => void;
};

export function usePresence({
  draftId,
  enabled = true,
  currentUser,
  onRevoked,
}: UsePresenceOptions) {
  const router = useRouter();
  const [onlinePresences, setOnlinePresences] = useState<CollaborationPresence[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");

  const connectionIdRef = useRef<string>("");
  const activeSurfaceRef = useRef<{
    surface?: "canvas" | "preview" | "left-sidebar" | "right-sidebar";
    sectionId?: string | null;
    fieldPath?: string | null;
  }>({});

  const isIdleRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const isFetchingRef = useRef(false);

  // Initialize connectionId per browser tab
  if (!connectionIdRef.current) {
    if (typeof window !== "undefined") {
      let saved = window.sessionStorage.getItem(`collab_conn_${draftId}`);
      if (!saved) {
        saved = crypto.randomUUID();
        window.sessionStorage.setItem(`collab_conn_${draftId}`, saved);
      }
      connectionIdRef.current = saved;
    }
  }

  // Heartbeat function (synchronizes presence and returns room members)
  const sendPulse = useCallback(async (stateOverride?: "active" | "idle") => {
    if (!draftId || !currentUser || !connectionIdRef.current || isFetchingRef.current) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

    isFetchingRef.current = true;
    try {
      const res = await fetch(`/api/drafts/${draftId}/collaboration/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: connectionIdRef.current,
          state: stateOverride ?? (isIdleRef.current ? "idle" : "active"),
          surface: activeSurfaceRef.current.surface,
          sectionId: activeSurfaceRef.current.sectionId,
          fieldPath: activeSurfaceRef.current.fieldPath,
        }),
      });

      if (res.status === 401) {
        setConnectionStatus("disconnected");
        if (onRevoked) {
          onRevoked();
        } else {
          alert("Akses kolaborasi Anda untuk undangan ini telah dicabut atau sesi telah berakhir.");
          router.push("/");
        }
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.isRevoked) {
          setConnectionStatus("disconnected");
          if (onRevoked) onRevoked();
          else {
            alert("Akses kolaborasi Anda untuk undangan ini telah dicabut.");
            router.push("/");
          }
          return;
        }

        setConnectionStatus("connected");
        if (Array.isArray(data.onlineUsers)) {
          setOnlinePresences(data.onlineUsers);
        }
      } else {
        setConnectionStatus("error");
      }
    } catch {
      setConnectionStatus("error");
    } finally {
      isFetchingRef.current = false;
    }
  }, [draftId, currentUser, onRevoked, router]);

  // Handle activity detection (idle timer)
  useEffect(() => {
    if (!enabled || !draftId || !currentUser) return;

    function handleUserActivity() {
      lastActivityRef.current = Date.now();
      if (isIdleRef.current) {
        isIdleRef.current = false;
        void sendPulse("active");
      }
    }

    const events = ["pointerdown", "keydown", "wheel", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    const idleChecker = setInterval(() => {
      if (!isIdleRef.current && Date.now() - lastActivityRef.current > 30_000) {
        isIdleRef.current = true;
        void sendPulse("idle");
      }
    }, 10_000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      clearInterval(idleChecker);
    };
  }, [enabled, draftId, currentUser, sendPulse]);

  // Periodic heartbeat loop (every 10s when active)
  useEffect(() => {
    if (!enabled || !draftId || !currentUser) {
      setConnectionStatus("disconnected");
      setOnlinePresences([]);
      return;
    }

    setConnectionStatus("connecting");
    // Initial pulse
    void sendPulse();

    const interval = setInterval(() => {
      void sendPulse();
    }, 10_000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sendPulse();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, draftId, currentUser, sendPulse]);

  // Method to report active editing surface / section
  const updateActiveSurface = useCallback((params: {
    surface?: "canvas" | "preview" | "left-sidebar" | "right-sidebar";
    sectionId?: string | null;
    fieldPath?: string | null;
  }) => {
    activeSurfaceRef.current = {
      ...activeSurfaceRef.current,
      ...params,
    };
  }, []);

  // Deduplicate online users by userId (combines multiple tabs of same user)
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
