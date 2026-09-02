"use client";

import React, { useState, useRef, useEffect } from "react";
import { CollaborationPresence } from "@/modules/collaboration/domain/presence";
import { CollaborationPopover } from "./CollaborationPopover";

type CollaboratorAvatarStackProps = {
  onlineUsers: CollaborationPresence[];
  currentUserId?: string;
  onOpenInviteModal: () => void;
};

export function CollaboratorAvatarStack({
  onlineUsers,
  currentUserId,
  onOpenInviteModal,
}: CollaboratorAvatarStackProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverOpen]);

  if (onlineUsers.length === 0) return null;

  const visibleUsers = onlineUsers.slice(0, 3);
  const remainingCount = onlineUsers.length - visibleUsers.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setPopoverOpen((prev) => !prev)}
        className="group relative flex items-center -space-x-1.5 rounded-full p-0.5 transition hover:opacity-90 active:scale-95 focus:outline-none"
        title="Klik untuk melihat kolaborator online"
        aria-label="Daftar kolaborator online"
      >
        {visibleUsers.map((user, idx) => {
          return (
            <div
              key={user.connectionId}
              className="relative rounded-full ring-2 ring-white shadow-xs transition-transform group-hover:scale-105"
              style={{ zIndex: 10 - idx }}
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div
                  className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-black text-white"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online Indicator Badge */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${
                  user.state === "active" ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
            </div>
          );
        })}

        {remainingCount > 0 && (
          <div
            className="grid h-7 w-7 place-items-center rounded-full bg-slate-800 text-[10px] font-black text-white ring-2 ring-white shadow-xs"
            style={{ zIndex: 5 }}
          >
            +{remainingCount}
          </div>
        )}
      </button>

      {popoverOpen && (
        <CollaborationPopover
          onClose={() => setPopoverOpen(false)}
          onlineUsers={onlineUsers}
          onOpenInviteModal={() => {
            setPopoverOpen(false);
            onOpenInviteModal();
          }}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
