"use client";

import React from "react";
import { Crown, Sparkles, UserCheck, UserPlus, Users, X } from "lucide-react";
import { CollaborationPresence } from "@/modules/collaboration/domain/presence";

type CollaborationPopoverProps = {
  open: boolean;
  onClose: () => void;
  onlineUsers: CollaborationPresence[];
  onOpenInviteModal: () => void;
  currentUserId?: string;
};

export function CollaborationPopover({
  open,
  onClose,
  onlineUsers,
  onOpenInviteModal,
  currentUserId,
}: CollaborationPopoverProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Users size={14} />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-900">Kolaborator Online</h3>
              <p className="text-[10px] font-semibold text-emerald-700">{onlineUsers.length} pengguna aktif</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Online Members List */}
        <div className="max-h-72 overflow-y-auto p-4 space-y-2">
          {onlineUsers.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">Tidak ada pengguna online saat ini.</p>
          ) : (
            onlineUsers.map((user) => {
              const isSelf = user.userId === currentUserId;
              return (
                <div
                  key={user.connectionId}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-2.5 transition ${
                    isSelf ? "border-emerald-200 bg-emerald-50/40" : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div
                          className="grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold text-white"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                          user.state === "active" ? "bg-emerald-500" : "bg-amber-400"
                        }`}
                        title={user.state === "active" ? "Aktif" : "Idle"}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {user.name} {isSelf && <span className="text-[10px] text-slate-400 font-normal">(Anda)</span>}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {user.sectionId ? `Sedang di: ${user.sectionId}` : user.state === "active" ? "Sedang aktif" : "Sedang idle"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                      user.role === "owner"
                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                        : user.role === "editor"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenInviteModal();
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 active:scale-98 transition"
          >
            <UserPlus size={14} />
            <span>Undang / Kelola Anggota Tim</span>
          </button>
        </div>
      </div>
    </div>
  );
}
