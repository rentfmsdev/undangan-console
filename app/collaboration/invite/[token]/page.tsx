"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  LoaderCircle,
  LogOut,
  Shield,
  Sparkles,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

type InviteDetails = {
  id: string;
  invitationId: string;
  targetEmail: string;
  role: "editor" | "viewer";
  status: "pending" | "accepted" | "declined" | "expired" | "revoked";
  isExpired: boolean;
  invitationTitle: string;
  templateCode: string;
  templateName: string;
  inviter: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  currentUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    matchesEmail: boolean;
  } | null;
};

export default function CollaborationInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [data, setData] = useState<InviteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;

    async function loadInvite() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/collaboration/invitations/${token}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Undangan tidak ditemukan atau sudah tidak berlaku.");
        } else {
          setData(json);
        }
      } catch {
        setError("Gagal memuat detail undangan. Periksa koneksi internet Anda.");
      } finally {
        setIsLoading(false);
      }
    }

    loadInvite();
  }, [token]);

  async function handleAccept() {
    if (!token) return;
    setIsAccepting(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/collaboration/invitations/${token}/accept`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setActionMessage({ type: "error", text: json.error || "Gagal menerima undangan." });
      } else {
        setActionMessage({
          type: "success",
          text: "Undangan berhasil diterima! Mengalihkan ke editor...",
        });
        setTimeout(() => {
          router.push(`/editor/${json.templateCode}/${json.draftId}`);
        }, 1200);
      }
    } catch {
      setActionMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setIsAccepting(false);
    }
  }

  async function handleDecline() {
    if (!token) return;
    if (!window.confirm("Apakah Anda yakin ingin menolak undangan kolaborasi ini?")) return;

    setIsDeclining(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/collaboration/invitations/${token}/decline`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setActionMessage({ type: "error", text: json.error || "Gagal menolak undangan." });
      } else {
        setActionMessage({ type: "success", text: "Undangan kolaborasi telah ditolak." });
        setData((prev) => (prev ? { ...prev, status: "declined" } : null));
      }
    } catch {
      setActionMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setIsDeclining(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-lg">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Undangan Studio</h1>
            <p className="text-[10px] font-semibold text-emerald-700 tracking-wider uppercase">Portal Kolaborasi Tim</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl">
          {isLoading ? (
            <div className="p-12 text-center">
              <LoaderCircle size={36} className="mx-auto animate-spin text-emerald-600" />
              <p className="mt-4 text-xs font-bold text-slate-600">Memeriksa undangan...</p>
            </div>
          ) : error || !data ? (
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertCircle size={28} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Undangan Tidak Tersedia</h2>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">{error}</p>
              </div>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {/* Card Header Banner */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-xs mb-3">
                    <Users size={12} /> Undangan Kolaborasi
                  </span>
                  <h2 className="text-lg font-extrabold leading-snug">
                    {data.inviter.name} Mengundang Anda
                  </h2>
                  <p className="mt-1 text-xs text-emerald-100 font-medium">
                    Untuk bersama-sama mengelola draft undangan pernikahan digital
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-5">
                {/* Status Messages / Action Feedback */}
                {actionMessage && (
                  <div
                    className={`rounded-2xl p-3.5 text-xs font-semibold flex items-center gap-2.5 ${
                      actionMessage.type === "success"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border border-rose-200 bg-rose-50 text-rose-800"
                    }`}
                  >
                    {actionMessage.type === "success" ? (
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0 text-rose-600" />
                    )}
                    <span>{actionMessage.text}</span>
                  </div>
                )}

                {/* Invitation Target Details Box */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Judul Undangan</p>
                      <h3 className="text-sm font-extrabold text-slate-900 truncate mt-0.5">{data.invitationTitle}</h3>
                    </div>
                    <span className="shrink-0 rounded-xl bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                      {data.templateName}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Peran Izin (Role)</p>
                      <p className="font-extrabold text-emerald-700 mt-0.5">
                        {data.role === "editor" ? "Bisa Mengedit (Editor)" : "Hanya Melihat (Viewer)"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Tujuan</p>
                      <p className="font-semibold text-slate-700 truncate mt-0.5">{data.targetEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Status Logic & Call-to-Actions */}
                {data.status === "accepted" ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-3">
                    <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      Anda sudah menerima undangan kolaborasi ini
                    </div>
                    <div>
                      <Link
                        href={`/editor/${data.templateCode}/${data.invitationId}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
                      >
                        <Layers size={14} />
                        Buka Editor Undangan
                      </Link>
                    </div>
                  </div>
                ) : data.status === "declined" ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                    <p className="text-xs font-bold text-slate-600">Undangan ini telah ditolak.</p>
                  </div>
                ) : data.isExpired || data.status === "expired" ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center space-y-1">
                    <p className="text-xs font-bold text-amber-800">Tautan undangan sudah kedaluwarsa</p>
                    <p className="text-[11px] text-amber-700">Silakan hubungi pemilik undangan untuk mengirimkan tautan baru.</p>
                  </div>
                ) : !data.currentUser ? (
                  /* User Not Logged In */
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center space-y-3">
                    <p className="text-xs text-slate-600">
                      Masuk dengan akun Google <strong className="text-slate-900">{data.targetEmail}</strong> untuk menerima undangan ini.
                    </p>
                    <Link
                      href={`/api/auth/google?returnTo=${encodeURIComponent(`/collaboration/invite/${token}`)}`}
                      className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition active:scale-95"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09A6.5 6.5 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Masuk dengan Google</span>
                    </Link>
                  </div>
                ) : !data.currentUser.matchesEmail ? (
                  /* Logged In with Different Email */
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-900 leading-relaxed">
                        <p className="font-bold">Akun Google Tidak Cocok</p>
                        <p className="mt-1">
                          Undangan ini ditujukan untuk <strong className="font-semibold">{data.targetEmail}</strong>, namun Anda saat ini masuk sebagai <strong className="font-semibold">{data.currentUser.email}</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/api/auth/google?returnTo=${encodeURIComponent(`/collaboration/invite/${token}`)}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700 transition"
                      >
                        Ganti Akun Google
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Logged In with Matching Email: Show Accept & Decline */
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      disabled={isAccepting || isDeclining}
                      onClick={handleAccept}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-98 transition disabled:opacity-50"
                    >
                      {isAccepting ? <LoaderCircle size={16} className="animate-spin" /> : <UserCheck size={16} />}
                      <span>Terima Undangan Kolaborasi</span>
                    </button>

                    <button
                      type="button"
                      disabled={isAccepting || isDeclining}
                      onClick={handleDecline}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-rose-600 transition disabled:opacity-50"
                    >
                      {isDeclining ? <LoaderCircle size={14} className="animate-spin" /> : <XCircle size={14} />}
                      <span>Tolak Undangan</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
