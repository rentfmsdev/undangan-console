"use client";

import React, { useEffect, useState } from "react";
import { RemoteCursor } from "@/modules/collaboration/domain/presence";

type RemoteCursorLayerProps = {
  cursors: RemoteCursor[];
  surface: "canvas" | "preview" | "left-sidebar" | "right-sidebar";
  className?: string;
};

export function RemoteCursorLayer({ cursors, surface, className = "" }: RemoteCursorLayerProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(query.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      query.addEventListener("change", listener);
      return () => query.removeEventListener("change", listener);
    }
  }, []);

  const activeCursors = cursors.filter((c) => c.surface === surface);

  if (activeCursors.length === 0) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-30 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {activeCursors.map((cursor) => {
        return (
          <div
            key={cursor.connectionId}
            className="absolute left-0 top-0 will-change-transform"
            style={{
              transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
              transition: reducedMotion ? "none" : "transform 70ms linear",
            }}
          >
            {/* SVG Cursor Pointer */}
            <svg
              className="h-4 w-4 drop-shadow-sm"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: cursor.color }}
            >
              <path
                d="M0 0L6 14.5L8.5 9L14 7L0 0Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            {/* Name Tag */}
            <div
              className="ml-3.5 -mt-1.5 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              <span>{cursor.name}</span>
              {cursor.sectionId && (
                <span className="opacity-80 text-[8px] font-normal">({cursor.sectionId})</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
