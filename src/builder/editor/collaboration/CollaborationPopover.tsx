"use client";

import React from "react";
import { UserPlus, Users, X } from "lucide-react";
import { CollaborationPresence } from "@/modules/collaboration/domain/presence";

type CollaborationPopoverProps = {
  onClose: () => void;
  onlineUsers: CollaborationPresence[];
  onOpenInviteModal: () => void;
  currentUserId?: string;
};

export function CollaborationPopover({
  onClose,
  onlineUsers,
  onOpenInviteModal,
  currentUserId,
}: CollaborationPopoverProps) {
  return (
    <div className="absolute right-0 top-full mt-2 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <Users size={13} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-none">Kolaborator Online</h3>
            <p className="text-[10px] font-medium text-emerald-700 mt-0.5">{onlineUsers.length} pengguna aktif</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          aria-label="Tutup"
        >
          <X size={14} />
        </button>
      </div>

      {/* Online Members List */}
      <div className="max-h-64 overflow-y-auto p-3 space-y-1.5">
        {onlineUsers.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">Tidak ada pengguna online saat ini.</p>
        ) : (
          onlineUsers.map((user) => {
            const isSelf = user.userId === currentUserId;
            return (
              <div
                key={user.connectionId}
                className={`flex items-center justify-between gap-2.5 rounded-xl border p-2 transition ${
                  isSelf ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100 bg-slate-50/50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="h-7 w-7 rounded-full border border-slate-200 object-cover"
                      />
                    ) : (
                      <div
                        className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-black text-white"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${
                        user.state === "active" ? "bg-emerald-500" : "bg-amber-400"
                      }`}
                      title={user.state === "active" ? "Aktif" : "Idle"}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                      {user.name} {isSelf && <span className="text-[10px] text-slate-400 font-normal">(Anda)</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {user.state === "active" ? "Sedang aktif" : "Sedang idle"}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    user.role === "owner"
                      ? "bg-amber-100 text-amber-800"
                      : user.role === "editor"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Action */}
      <div className="border-t border-slate-100 bg-slate-50/50 p-2.5">
        <button
          type="button"
          onClick={onOpenInviteModal}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 shadow-xs"
        >
          <UserPlus size={13} />
          <span>Undang / Kelola Anggota Tim</span>
        </button>
      </div>
    </div>
  );
}
