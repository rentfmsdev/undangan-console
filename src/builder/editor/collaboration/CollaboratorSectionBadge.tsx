"use client";

import React from "react";
import { CollaborationPresence } from "@/modules/collaboration/domain/presence";

type CollaboratorSectionBadgeProps = {
  sectionId: string;
  onlineUsers: CollaborationPresence[];
  currentUserId?: string;
};

export function CollaboratorSectionBadge({
  sectionId,
  onlineUsers,
  currentUserId,
}: CollaboratorSectionBadgeProps) {
  // Find other collaborators currently at this sectionId
  const peers = onlineUsers.filter(
    (u) => u.sectionId === sectionId && u.userId !== currentUserId
  );

  if (peers.length === 0) return null;

  return (
    <div className="pointer-events-none flex items-center gap-1">
      {peers.slice(0, 2).map((peer) => (
        <span
          key={peer.connectionId}
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white shadow-2xs"
          style={{ backgroundColor: peer.color }}
          title={`${peer.name} sedang melihat/mengedit section ini`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse" />
          <span className="max-w-[50px] truncate">{peer.name.split(" ")[0]}</span>
        </span>
      ))}
      {peers.length > 2 && (
        <span className="rounded-full bg-slate-700 px-1 py-0.5 text-[8px] font-bold text-white">
          +{peers.length - 2}
        </span>
      )}
    </div>
  );
}
