"use client";

import React from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";

type CollaborationStatusProps = {
  status: "connecting" | "connected" | "disconnected" | "error";
  onlineCount: number;
};

export function CollaborationStatus({ status, onlineCount }: CollaborationStatusProps) {
  // Presence only earns a spot in the header when a collaborator is active.
  if (status === "disconnected" || onlineCount < 1) return null;

  return (
    <StatusBadge
      tone={status === "connected" ? "success" : status === "connecting" ? "warning" : "neutral"}
      icon={<span className={`h-1.5 w-1.5 rounded-full ${status === "connected" ? "bg-emerald-500 animate-pulse" : status === "connecting" ? "bg-amber-500 animate-pulse" : "bg-slate-400"}`} />}
      title={
        status === "connected"
          ? `Kolaborasi realtime aktif (${onlineCount} online)`
          : status === "connecting"
          ? "Menyambungkan ke ruang kolaborasi..."
          : "Koneksi kolaborasi terputus"
      }
    >
      <span className="hidden sm:inline">
        {status === "connected" ? `${onlineCount} online` : status === "connecting" ? "Menyambung" : "Offline"}
      </span>
    </StatusBadge>
  );
}
