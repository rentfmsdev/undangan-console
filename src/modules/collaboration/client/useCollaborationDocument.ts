"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import {
  extractStateFromYDoc,
  initYDocFromState,
  SharedDraftState,
  SharedSectionRecord,
} from "../domain/crdt-mapper";

type UseCollaborationDocumentOptions = {
  draftId?: string | null;
  enabled?: boolean;
  initialState?: SharedDraftState | null;
  onRemoteStateChange?: (state: SharedDraftState) => void;
  broadcastDocUpdate?: (updateBase64: string) => void;
};

export function useCollaborationDocument({
  draftId,
  enabled = true,
  initialState,
  onRemoteStateChange,
  broadcastDocUpdate,
}: UseCollaborationDocumentOptions) {
  const ydocRef = useRef<Y.Doc>(new Y.Doc());
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "offline">("synced");
  const isApplyingRemoteRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastDocUpdateRef = useRef(broadcastDocUpdate);
  broadcastDocUpdateRef.current = broadcastDocUpdate;

  const setBroadcastHandler = useCallback((fn: (b64: string) => void) => {
    broadcastDocUpdateRef.current = fn;
  }, []);

  // Initialize from initial state or offline storage
  useEffect(() => {
    if (!enabled || !draftId) return;

    const doc = ydocRef.current;

    // Load offline cached update if any
    if (typeof window !== "undefined") {
      try {
        const cached = window.localStorage.getItem(`undangan_crdt_snap_${draftId}`);
        if (cached) {
          const update = Uint8Array.from(atob(cached), (c) => c.charCodeAt(0));
          Y.applyUpdate(doc, update);
        }
      } catch {}
    }

    if (initialState) {
      initYDocFromState(initialState, doc);
    }
  }, [enabled, draftId, initialState]);

  // Handle incoming remote update from peer via WebSocket
  const applyRemoteUpdate = useCallback((updateBase64: string) => {
    if (!updateBase64) return;
    try {
      isApplyingRemoteRef.current = true;
      const update = Uint8Array.from(atob(updateBase64), (c) => c.charCodeAt(0));
      Y.applyUpdate(ydocRef.current, update);

      // Cache offline
      if (typeof window !== "undefined" && draftId) {
        try {
          const fullSnap = btoa(String.fromCharCode(...Y.encodeStateAsUpdate(ydocRef.current)));
          window.localStorage.setItem(`undangan_crdt_snap_${draftId}`, fullSnap);
        } catch {}
      }

      if (onRemoteStateChange) {
        const extracted = extractStateFromYDoc(ydocRef.current);
        onRemoteStateChange(extracted);
      }
    } finally {
      isApplyingRemoteRef.current = false;
    }
  }, [draftId, onRemoteStateChange]);

  // Method called when local user changes section data or settings
  const updateLocalState = useCallback((updater: (doc: Y.Doc) => void) => {
    const doc = ydocRef.current;
    let updateBytes: Uint8Array | null = null;

    const onUpdate = (u: Uint8Array) => {
      updateBytes = u;
    };

    doc.once("update", onUpdate);
    doc.transact(() => {
      updater(doc);
    });

    if (updateBytes && broadcastDocUpdateRef.current && !isApplyingRemoteRef.current) {
      setSyncStatus("saving");
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      const b64 = btoa(String.fromCharCode(...updateBytes));
      broadcastDocUpdateRef.current(b64);

      // Cache offline
      if (typeof window !== "undefined" && draftId) {
        try {
          const fullSnap = btoa(String.fromCharCode(...Y.encodeStateAsUpdate(doc)));
          window.localStorage.setItem(`undangan_crdt_snap_${draftId}`, fullSnap);
        } catch {}
      }

      syncTimeoutRef.current = setTimeout(() => {
        setSyncStatus("synced");
      }, 600);
    }
  }, [draftId]);

  return {
    ydoc: ydocRef.current,
    syncStatus,
    applyRemoteUpdate,
    updateLocalState,
    setBroadcastHandler,
  };
}
