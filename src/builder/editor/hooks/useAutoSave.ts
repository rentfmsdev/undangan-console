"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

export type UseAutoSaveOptions<T> = {
  /** The state/data object to be persisted */
  data: T;
  /** Whether autosave is currently active (e.g. true once draft is ready) */
  enabled?: boolean;
  /** Debounce delay in milliseconds before saving (default: 1800ms) */
  debounceMs?: number;
  /** Max wait time in ms before forced save even if user keeps typing (default: 6000ms) */
  maxWaitMs?: number;
  /** Async save callback handler */
  onSave: (data: T) => Promise<void> | void;
  /** Optional error callback */
  onError?: (err: unknown) => void;
};

export type UseAutoSaveReturn = {
  /** Current status of the autosave pipeline */
  status: AutoSaveStatus;
  /** Timestamp of the last successful save */
  lastSavedAt: Date | null;
  /** Force an immediate save without waiting for debounce */
  flush: () => Promise<void>;
  /** Clear error status */
  resetError: () => void;
};

export function useAutoSave<T>({
  data,
  enabled = true,
  debounceMs = 1800,
  maxWaitMs = 6000,
  onSave,
  onError,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const dataRef = useRef<T>(data);
  dataRef.current = data;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSerializedRef = useRef<string>("");
  const isSavingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Core save execution
  const executeSave = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    const currentData = dataRef.current;
    const serialized = JSON.stringify(currentData);

    // Skip network request if data hasn't changed since last successful save
    if (serialized === lastSavedSerializedRef.current) {
      if (isMountedRef.current) setStatus("saved");
      return;
    }

    // Clear any active scheduled timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }

    isSavingRef.current = true;
    if (isMountedRef.current) setStatus("saving");

    try {
      await onSaveRef.current(currentData);
      lastSavedSerializedRef.current = serialized;
      if (isMountedRef.current) {
        setStatus("saved");
        setLastSavedAt(new Date());
      }
    } catch (err) {
      if (isMountedRef.current) setStatus("error");
      onErrorRef.current?.(err);
    } finally {
      isSavingRef.current = false;
    }
  }, [enabled]);

  // Track data changes and trigger debounced schedule
  useEffect(() => {
    if (!enabled) return;

    const serialized = JSON.stringify(data);

    // Initial snapshot initialization
    if (!lastSavedSerializedRef.current) {
      lastSavedSerializedRef.current = serialized;
      setStatus("saved");
      setLastSavedAt(new Date());
      return;
    }

    // If data is identical to last saved, no action needed
    if (serialized === lastSavedSerializedRef.current) {
      return;
    }

    // Mark as unsaved
    setStatus("unsaved");

    // Reset standard debounce timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void executeSave();
    }, debounceMs);

    // Ensure maximum wait timer doesn't starve save during prolonged typing
    if (!maxTimerRef.current) {
      maxTimerRef.current = setTimeout(() => {
        void executeSave();
      }, maxWaitMs);
    }
  }, [data, enabled, debounceMs, maxWaitMs, executeSave]);

  // Flush on page visibility change (e.g. user switches tabs or minimizes window)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && status === "unsaved") {
        void executeSave();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === "unsaved") {
        void executeSave();
        // Standard prompt if there's unsaved pending state
        e.preventDefault();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [status, executeSave]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    };
  }, []);

  const resetError = useCallback(() => {
    if (status === "error") setStatus("unsaved");
  }, [status]);

  return {
    status,
    lastSavedAt,
    flush: executeSave,
    resetError,
  };
}
