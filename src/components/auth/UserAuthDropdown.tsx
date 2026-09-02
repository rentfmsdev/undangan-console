"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Layers, LogOut, Sparkles, User, UserPlus } from "lucide-react";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role?: string;
};

type UserAuthDropdownProps = {
  user: AuthUser | null;
  onLoginClick: () => void;
  onLogout?: () => void;
  onMyInvitationsClick?: () => void;
  onInviteCollaboratorClick?: () => void;
  compact?: boolean;
};

export function UserAuthDropdown({
  user,
  onLoginClick,
  onLogout,
  onMyInvitationsClick,
  onInviteCollaboratorClick,
  compact = false,
}: UserAuthDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingInvitationCount, setPendingInvitationCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setPendingInvitationCount(0);
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch("/api/collaboration/invitations", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (!cancelled) setPendingInvitationCount(Array.isArray(payload.invitations) ? payload.invitations.length : 0);
      } catch {
        // Badge is supplemental; a failed notification request must not affect auth UI.
      }
    };

    void refresh();
    const interval = window.setInterval(refresh, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      if (onLogout) {
        onLogout();
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  // Not logged in: Show Google Login button
  if (!user) {
    return (
      <button
        type="button"
        onClick={onLoginClick}
        className={`inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white ${
          compact ? "px-3 py-1.5 text-[11px]" : "px-3.5 py-2 text-xs"
        } font-semibold text-slate-800 shadow-xs transition hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm active:scale-95`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09A6.5 6.5 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Masuk</span>
      </button>
    );
  }

  // Logged in: Show user avatar pill & dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white ${
          compact ? "px-2.5 py-1.5" : "px-3 py-1.5"
        } shadow-xs transition hover:border-slate-300 hover:bg-slate-50 active:scale-95`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.avatarUrl ? (
          // Avatar Google berasal dari host dinamis dan tidak cocok dipaksa melalui image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.name}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            className="h-6 w-6 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="max-w-[100px] sm:max-w-[120px] truncate text-xs font-semibold text-slate-800 text-left">
          {user.name}
        </span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
        {pendingInvitationCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-4 h-4 place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-extrabold leading-none text-white shadow-sm" aria-label={`${pendingInvitationCount} undangan kolaborasi baru`}>
            {pendingInvitationCount > 9 ? "9+" : pendingInvitationCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150 z-50">
          {/* User Info Header */}
          <div className="flex items-center gap-3 p-2.5 bg-slate-50/80 rounded-xl mb-1.5">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="h-9 w-9 rounded-full border border-slate-200 object-cover shrink-0"
              />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900 leading-snug">{user.name}</p>
              <p className="truncate text-[10px] font-medium text-slate-500 leading-snug">{user.email}</p>
              <span className="mt-1 inline-block rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                {user.role ?? "Member"}
              </span>
            </div>
          </div>

          <div className="space-y-0.5">
            {/* Undangan Saya */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onMyInvitationsClick) {
                  onMyInvitationsClick();
                }
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition group"
              style={{ fontSize: "12px", fontWeight: 600 }}
            >
              <Layers size={15} className="text-slate-400 group-hover:text-emerald-600 shrink-0" />
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2 text-[12px] font-semibold text-slate-700 group-hover:text-emerald-800" style={{ fontSize: "12px", fontWeight: 600 }}>
                <span>Undangan Saya</span>
                {pendingInvitationCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white group-hover:bg-rose-600">
                    {pendingInvitationCount > 9 ? "9+" : pendingInvitationCount} baru
                  </span>
                )}
              </span>
            </button>

            {/* Undang Kolaborator */}
            {onInviteCollaboratorClick && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onInviteCollaboratorClick();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition group"
                style={{ fontSize: "12px", fontWeight: 600 }}
              >
                <UserPlus size={15} className="text-slate-400 group-hover:text-emerald-600 shrink-0" />
                <span className="text-[12px] font-semibold text-slate-700 group-hover:text-emerald-800" style={{ fontSize: "12px", fontWeight: 600 }}>Undang Kolaborator</span>
              </button>
            )}

            {/* Marketplace / Pilih Template */}
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              style={{ fontSize: "12px", fontWeight: 600 }}
            >
              <Sparkles size={15} className="text-slate-400 shrink-0" />
              <span className="text-[12px] font-semibold text-slate-700" style={{ fontSize: "12px", fontWeight: 600 }}>Cari Template</span>
            </Link>
          </div>

          <div className="my-1 border-t border-slate-100" />

          {/* Logout */}
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
            style={{ fontSize: "12px", fontWeight: 600 }}
          >
            <LogOut size={15} className="shrink-0 text-rose-500" />
            <span className="text-[12px] font-semibold text-rose-600" style={{ fontSize: "12px", fontWeight: 600 }}>{isLoggingOut ? "Keluar..." : "Keluar Akun"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
