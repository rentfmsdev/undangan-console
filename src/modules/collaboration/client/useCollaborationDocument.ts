"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import {
  extractStateFromYDoc,
  initYDocFromState,
  SharedDraftState,
} from "../domain/crdt-mapper";

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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
  const localOriginRef = useRef<object>({}); // Unique reference object per client instance
  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "offline">("synced");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const isApplyingRemoteRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastDocUpdateRef = useRef(broadcastDocUpdate);
  if (broadcastDocUpdate) {
    broadcastDocUpdateRef.current = broadcastDocUpdate;
  }

  const setBroadcastHandler = useCallback((fn: (b64: string) => void) => {
    broadcastDocUpdateRef.current = fn;
  }, []);

  // Initialize the local CRDT container and setup UndoManager. Do not apply a
  // previously cached full Yjs snapshot before the authenticated server snapshot:
  // two independently-created documents can have conflicting Yjs client clocks,
  // causing an old local value to win visually without ever reaching the server.
  // Offline edits are still persisted through the HTTP fallback; proper Yjs
  // offline replay requires a state-vector sync protocol and must not be faked by
  // merging arbitrary full snapshots here.
  useEffect(() => {
    if (!enabled || !draftId) return;

    const doc = ydocRef.current;

    if (initialState) {
      initYDocFromState(initialState, doc);
    }

    // Create UndoManager specifically tracking this client's local origin
    const undoManager = new Y.UndoManager(
      [
        doc.getMap("metadata"),
        doc.getMap("globalSettings"),
        doc.getArray("sectionOrder"),
        doc.getMap("sections"),
      ],
      {
        trackedOrigins: new Set([localOriginRef.current]),
      }
    );

    undoManager.on("stack-item-added", () => {
      setCanUndo(undoManager.undoStack.length > 0);
      setCanRedo(undoManager.redoStack.length > 0);
    });

    undoManager.on("stack-item-popped", () => {
      setCanUndo(undoManager.undoStack.length > 0);
      setCanRedo(undoManager.redoStack.length > 0);
    });

    undoManagerRef.current = undoManager;

    return () => {
      undoManager.destroy();
      undoManagerRef.current = null;
    };
  }, [enabled, draftId, initialState]);

  // Handle incoming remote update from peer via WebSocket
  const applyRemoteUpdate = useCallback((updateBase64: string) => {
    if (!updateBase64) return;
    try {
      isApplyingRemoteRef.current = true;
      const update = Uint8Array.from(atob(updateBase64), (c) => c.charCodeAt(0));
      // Applied without localOrigin, so it is NOT tracked by this client's undoManager!
      Y.applyUpdate(ydocRef.current, update);

      // Cache offline
      if (typeof window !== "undefined" && draftId) {
        try {
          const fullSnap = uint8ArrayToBase64(Y.encodeStateAsUpdate(ydocRef.current));
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
    // Execute transaction with localOrigin so it's isolated to this client's UndoManager
    doc.transact(() => {
      updater(doc);
    }, localOriginRef.current);

    if (updateBytes && broadcastDocUpdateRef.current && !isApplyingRemoteRef.current) {
      setSyncStatus("saving");
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      const b64 = uint8ArrayToBase64(updateBytes);
      broadcastDocUpdateRef.current(b64);

      // Cache offline
      if (typeof window !== "undefined" && draftId) {
        try {
          const fullSnap = uint8ArrayToBase64(Y.encodeStateAsUpdate(doc));
          window.localStorage.setItem(`undangan_crdt_snap_${draftId}`, fullSnap);
        } catch {}
      }

      syncTimeoutRef.current = setTimeout(() => {
        setSyncStatus("synced");
      }, 600);
    }
  }, [draftId]);

  // Isolated Undo: undoes ONLY changes made by this local user
  const undo = useCallback(() => {
    const um = undoManagerRef.current;
    if (!um || um.undoStack.length === 0) return null;

    const doc = ydocRef.current;
    let updateBytes: Uint8Array | null = null;
    const onUpdate = (u: Uint8Array) => {
      updateBytes = u;
    };

    doc.once("update", onUpdate);
    um.undo();

    setCanUndo(um.undoStack.length > 0);
    setCanRedo(um.redoStack.length > 0);

    if (updateBytes && broadcastDocUpdateRef.current) {
      const b64 = uint8ArrayToBase64(updateBytes);
      broadcastDocUpdateRef.current(b64);
    }

    const state = extractStateFromYDoc(doc);
    return state;
  }, []);

  // Isolated Redo: redoes ONLY changes made by this local user
  const redo = useCallback(() => {
    const um = undoManagerRef.current;
    if (!um || um.redoStack.length === 0) return null;

    const doc = ydocRef.current;
    let updateBytes: Uint8Array | null = null;
    const onUpdate = (u: Uint8Array) => {
      updateBytes = u;
    };

    doc.once("update", onUpdate);
    um.redo();

    setCanUndo(um.undoStack.length > 0);
    setCanRedo(um.redoStack.length > 0);

    if (updateBytes && broadcastDocUpdateRef.current) {
      const b64 = uint8ArrayToBase64(updateBytes);
      broadcastDocUpdateRef.current(b64);
    }

    const state = extractStateFromYDoc(doc);
    return state;
  }, []);

  // Restoring a version must be represented as a normal CRDT transaction so
  // every connected collaborator receives the exact same state transition.
  const replaceState = useCallback((nextState: SharedDraftState) => {
    updateLocalState((doc) => {
      initYDocFromState(nextState, doc);
    });
    return extractStateFromYDoc(ydocRef.current);
  }, [updateLocalState]);

  return {
    ydoc: ydocRef.current,
    syncStatus,
    canUndo,
    canRedo,
    undo,
    redo,
    replaceState,
    applyRemoteUpdate,
    updateLocalState,
    setBroadcastHandler,
  };
}
