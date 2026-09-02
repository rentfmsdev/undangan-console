"use client";

import { Check, Copy, Crown, LoaderCircle, Mail, Shield, Trash2, UserCheck, UserPlus, Users, X } from "lucide-react";
import React, { useEffect, useState } from "react";

export type CollaboratorItem = {
  id: string;
  email: string;
  role: "editor" | "viewer";
  status: "pending" | "accepted";
  inviteToken?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
};

export type OwnerItem = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

type Props = {
  open: boolean;
  draftId: string | null;
  templateCode: string;
  onClose: () => void;
  onRequireLogin: (reason: string) => void;
};

export function InviteCollaboratorModal({
  open,
  draftId,
  templateCode,
  onClose,
  onRequireLogin,
}: Props) {
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<"editor" | "viewer">("editor");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [owner, setOwner] = useState<OwnerItem | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorItem[]>([]);
  const [isOwner, setIsOwner] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch collaborators list
  useEffect(() => {
    if (!open || !draftId) return;

    let active = true;
    setIsLoading(true);
    setError("");
    setSuccess("");

    async function loadCollaborators() {
      try {
        const res = await fetch(`/api/drafts/${draftId}/collaborators`);
        if (res.status === 401) {
          onRequireLogin("Masuk dengan Google untuk mengelola kolaborasi undangan.");
          onClose();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setOwner(data.owner);
            setCollaborators(data.collaborators || []);
            setIsOwner(Boolean(data.isOwner));
          }
        }
      } catch {
        if (active) setError("Gagal memuat daftar kolaborator.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadCollaborators();

    return () => {
      active = false;
    };
  }, [open, draftId, onClose, onRequireLogin]);

  // Handle Invite Form Submit
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!draftId) return;
    const targetEmail = emailInput.trim().toLowerCase();
    if (!targetEmail) return;

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/drafts/${draftId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, role: roleInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengundang kolaborator.");
      } else {
        setSuccess(data.message || `Undangan berhasil dikirim ke ${targetEmail}!`);
        setEmailInput("");
        // Reload list
        const listRes = await fetch(`/api/drafts/${draftId}/collaborators`);
        if (listRes.ok) {
          const listData = await listRes.json();
          setCollaborators(listData.collaborators || []);
        }
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Role Change
  async function handleChangeRole(collaboratorId: string, newRole: "editor" | "viewer") {
    if (!draftId) return;
    try {
      const res = await fetch(`/api/drafts/${draftId}/collaborators/${collaboratorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setCollaborators((prev) =>
          prev.map((c) => (c.id === collaboratorId ? { ...c, role: newRole } : c))
        );
        setSuccess("Peran kolaborator berhasil diperbarui.");
      } else {
        const data = await res.json();
        setError(data.error || "Gagal mengubah peran.");
      }
    } catch {
      setError("Gagal menghubungi server.");
    }
  }

  // Handle Resend Invite
  async function handleResendInvite(collaboratorId: string, email: string) {
    if (!draftId) return;
    try {
      const res = await fetch(`/api/drafts/${draftId}/collaborators/${collaboratorId}/resend`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Undangan untuk ${email} diperbarui! Link: ${data.inviteUrl}`);
        if (data.inviteUrl) {
          await navigator.clipboard.writeText(data.inviteUrl);
        }
      } else {
        setError(data.error || "Gagal mengirim ulang undangan.");
      }
    } catch {
      setError("Gagal menghubungi server.");
    }
  }

  // Handle Delete / Revoke Collaborator
  async function handleDeleteCollaborator(collaboratorId: string, email: string) {
    if (!draftId) return;
    if (!window.confirm(`Cabut akses kolaborasi untuk ${email}?`)) return;

    try {
      const res = await fetch(`/api/drafts/${draftId}/collaborators/${collaboratorId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
        setSuccess(`Akses untuk ${email} berhasil dicabut.`);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal mencabut akses kolaborator.");
      }
    } catch {
      setError("Gagal menghubungi server.");
    }
  }

  // Copy Collaboration Share Link
  async function handleCopyShareLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareLink = `${origin}/editor/${templateCode}/${draftId}`;
    await navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Kolaborasi Undangan</h2>
              <p className="text-xs text-slate-500">
                Undang pasangan, Wedding Organizer, atau keluarga untuk mengedit draft bersama.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Alerts */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
              {success}
            </div>
          )}

          {/* Invite Form (Only for Owner) */}
          {isOwner ? (
            <form onSubmit={handleInvite} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <label className="block text-xs font-bold text-slate-800 mb-2.5">
                Undang Kolaborator Baru
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Masukkan alamat email Google (misal: pasangan@gmail.com)"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Izin Akses:</span>
                    <select
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value as "editor" | "viewer")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-600"
                    >
                      <option value="editor">Bisa Edit (Editor)</option>
                      <option value="viewer">Hanya Lihat (Viewer)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !emailInput.trim()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <UserPlus size={14} />
                    )}
                    <span>Kirim Undangan</span>
                  </button>
                </div>
              </div>
              <p className="mt-2.5 text-[10px] text-slate-500">
                Kolaborator yang diundang cukup masuk menggunakan akun Google tersebut untuk mulai mengedit.
              </p>
            </form>
          ) : (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900">
              <p className="font-bold">Anda berpartisipasi sebagai Kolaborator</p>
              <p className="mt-0.5 text-[11px] text-blue-800/80">
                Hanya pemilik undangan yang dapat menambahkan atau menghapus kolaborator lainnya.
              </p>
            </div>
          )}

          {/* Quick Share Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-600 shrink-0">
                <Shield size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">Tautan Kerja Tim</p>
                <p className="text-[10px] text-slate-400 truncate">Bagi link ini ke kolaborator yang sudah diundang</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            >
              {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedLink ? "Link Disalin!" : "Salin Link Editor"}</span>
            </button>
          </div>

          {/* Active Team List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Anggota Tim ({1 + collaborators.length})
              </h3>
              {isLoading && <LoaderCircle size={14} className="animate-spin text-emerald-600" />}
            </div>

            <div className="space-y-2">
              {/* Owner Item */}
              {owner && (
                <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/40 p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {owner.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={owner.avatarUrl}
                        alt={owner.name}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="h-8 w-8 rounded-full border border-amber-300 object-cover shrink-0"
                      />
                    ) : (
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-600 text-xs font-bold text-white shrink-0">
                        {owner.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">{owner.name}</p>
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-900">
                          <Crown size={10} />
                          Owner
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{owner.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Pemilik Draft</span>
                </div>
              )}

              {/* Collaborator Items */}
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {c.user?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.user.avatarUrl}
                        alt={c.user.name}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="h-8 w-8 rounded-full border border-slate-200 object-cover shrink-0"
                      />
                    ) : (
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-600 text-xs font-bold text-white shrink-0">
                        {(c.user?.name || c.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {c.user ? c.user.name : c.email.split("@")[0]}
                        </p>
                        {c.status === "accepted" ? (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 border border-emerald-200/60">
                            <UserCheck size={10} /> Aktif
                          </span>
                        ) : c.status === "declined" ? (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
                            Ditolak
                          </span>
                        ) : c.status === "revoked" ? (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                            Dicabut
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200/60">
                            Menunggu Konfirmasi
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{c.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-center">
                    {/* Role Selector */}
                    {isOwner ? (
                      <select
                        value={c.role}
                        onChange={(e) => handleChangeRole(c.id, e.target.value as "editor" | "viewer")}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-emerald-600"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                          c.role === "editor" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {c.role === "editor" ? "Editor" : "Viewer"}
                      </span>
                    )}

                    {/* Resend button if pending or revoked */}
                    {isOwner && c.status !== "accepted" && (
                      <button
                        type="button"
                        onClick={() => handleResendInvite(c.id, c.email)}
                        className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition"
                        title="Kirim ulang undangan dan salin link baru"
                      >
                        Kirim Ulang
                      </button>
                    )}

                    {/* Revoke button */}
                    {isOwner && c.status !== "revoked" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCollaborator(c.id, c.email)}
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Cabut Akses Kolaborator"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {collaborators.length === 0 && !isLoading && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  Belum ada kolaborator yang diundang. Masukkan email di atas untuk mengundang tim Anda.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
