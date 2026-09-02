"use client";

import React from "react";
import { Users } from "lucide-react";

type CollaborationStatusProps = {
  status: "connecting" | "connected" | "disconnected" | "error";
  onlineCount: number;
};

export function CollaborationStatus({ status, onlineCount }: CollaborationStatusProps) {
  if (status === "disconnected") return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border transition ${
        status === "connected"
          ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
          : status === "connecting"
          ? "border-amber-200 bg-amber-50/80 text-amber-800"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
      title={
        status === "connected"
          ? `Kolaborasi realtime aktif (${onlineCount} online)`
          : status === "connecting"
          ? "Menyambungkan ke ruang kolaborasi..."
          : "Koneksi kolaborasi terputus"
      }
    >
      <span
        className={`h-2 w-2 rounded-full ${
          status === "connected"
            ? "bg-emerald-500 animate-pulse"
            : status === "connecting"
            ? "bg-amber-400 animate-ping"
            : "bg-slate-400"
        }`}
      />
      <span className="hidden sm:inline">
        {status === "connected" ? `${onlineCount} Online` : status === "connecting" ? "Menyambung..." : "Offline"}
      </span>
    </div>
  );
}
