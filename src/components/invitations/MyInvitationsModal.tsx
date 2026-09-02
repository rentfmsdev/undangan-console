"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  Clock,
  Edit3,
  ExternalLink,
  Globe,
  Layers,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";

export type UserDraftItem = {
  id: string;
  title: string;
  templateId: string;
  templateCode: string;
  templateName: string;
  category: string;
  coverImage: string;
  themeId: string;
  status: "draft" | "published" | "custom" | "archived";
  slug: string | null;
  subdomain: string | null;
  createdAt: string;
  updatedAt: string;
  isCollaborator?: boolean;
  collabRole?: string;
};

type MyInvitationsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function MyInvitationsModal({ open, onClose }: MyInvitationsModalProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<UserDraftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "published" | "custom">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchDrafts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/drafts", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Silakan masuk terlebih dahulu untuk melihat undangan Anda.");
        }
        throw new Error("Gagal memuat daftar undangan.");
      }
      const data = await res.json();
      setDrafts(data.drafts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      void fetchDrafts();
      setSearchQuery("");
      setFilterStatus("all");
      setConfirmDeleteId(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const handleDeleteDraft = async (draftId: string) => {
    setDeletingId(draftId);
    try {
      const res = await fetch(`/api/drafts/${draftId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus draft.");
      setDrafts((prev) => prev.filter((item) => item.id !== draftId));
      setConfirmDeleteId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus draft.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDrafts = useMemo(() => {
    return drafts.filter((draft) => {
      const matchesStatus = filterStatus === "all" || draft.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        draft.title.toLowerCase().includes(q) ||
        draft.templateName.toLowerCase().includes(q) ||
        draft.templateCode.toLowerCase().includes(q) ||
        (draft.slug && draft.slug.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [drafts, filterStatus, searchQuery]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-invitations-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Layers size={20} />
            </div>
            <div>
              <h2 id="my-invitations-title" className="text-base font-extrabold text-slate-900 leading-tight">
                Undangan Saya
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">
                Kelola seluruh draf dan undangan digital yang Anda buat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar Filter & Search */}
        {!isLoading && !error && drafts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 bg-white px-6 py-3">
            {/* Search input */}
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul atau template..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-3 focus:ring-emerald-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 self-start sm:self-auto rounded-xl bg-slate-100 p-1">
              {(
                [
                  ["all", "Semua"],
                  ["draft", "Draf"],
                  ["custom", "Custom"],
                  ["published", "Published"],
                ] as const
              ).map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    filterStatus === status
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-pulse"
                >
                  <div className="h-24 w-18 rounded-xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                    <div className="h-3 w-2/3 rounded bg-slate-200" />
                    <div className="mt-4 flex gap-2 pt-2">
                      <div className="h-8 flex-1 rounded-xl bg-slate-200" />
                      <div className="h-8 w-8 rounded-xl bg-slate-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {!isLoading && error && (
            <div className="my-8 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
              <p className="text-xs font-bold text-rose-700">{error}</p>
              <button
                type="button"
                onClick={fetchDrafts}
                className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Empty State: Belum Ada Undangan */}
          {!isLoading && !error && drafts.length === 0 && (
            <div className="my-10 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-xs">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-xs">
                <Sparkles size={26} />
              </div>
              <h3 className="mt-4 text-base font-extrabold text-slate-900">Belum Ada Undangan</h3>
              <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Anda belum memiliki undangan yang dibuat. Pilih salah satu template impian Anda dan mulai kustomisasi
                sekarang!
              </p>
              <Link
                href="/"
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
              >
                <Plus size={15} />
                <span>Pilih Template & Buat Undangan</span>
              </Link>
            </div>
          )}

          {/* Empty Filter Result */}
          {!isLoading && !error && drafts.length > 0 && filteredDrafts.length === 0 && (
            <div className="my-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <Search size={24} className="mx-auto text-slate-400" />
              <p className="mt-3 text-xs font-bold text-slate-800">Tidak ada undangan yang cocok</p>
              <p className="mt-1 text-[11px] text-slate-500">Coba ubah kata kunci pencarian atau filter status.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
                className="mt-4 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* Draft Cards Grid */}
          {!isLoading && !error && filteredDrafts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDrafts.map((draft) => {
                const isPublished = draft.status === "published";
                const isCustom = draft.status === "custom";
                const isConfirmingDelete = confirmDeleteId === draft.id;
                const isDeleting = deletingId === draft.id;

                return (
                  <div
                    key={draft.id}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex gap-3.5">
                      {/* Thumbnail Mockup */}
                      <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200/60 p-1 flex items-center justify-center">
                        <Image
                          src={draft.coverImage || "/thumb/wedding-elegance.png"}
                          alt={draft.title}
                          fill
                          className="object-contain"
                          sizes="80px"
                        />
                      </div>

                      {/* Info & Details */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          {/* Title & Status */}
                          <div className="flex items-start justify-between gap-1.5 flex-wrap">
                            <h3 className="truncate text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition" title={draft.title}>
                              {draft.title}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0">
                              {draft.isCollaborator && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-extrabold text-indigo-700 border border-indigo-200/60">
                                  <Users size={10} /> Kolaborator
                                </span>
                              )}
                              {isPublished ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 border border-emerald-200/60">
                                  <Check size={10} /> Published
                                </span>
                              ) : isCustom ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold text-amber-700">
                                  <Clock size={10} /> Custom
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                                  Draf
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Template Name & Code */}
                          <p className="mt-1 truncate text-[11px] font-medium text-slate-500">
                            {draft.templateName} · <span className="font-mono text-slate-600 font-semibold">{draft.templateCode}</span>
                          </p>
                        </div>

                        {/* Last Updated Timestamp */}
                        <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-slate-400">
                          <Clock size={11} className="shrink-0" />
                          <span className="truncate">
                            Diedit {new Date(draft.updatedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
                      {isConfirmingDelete ? (
                        <div className="flex w-full items-center justify-between gap-2 bg-rose-50 p-1.5 rounded-xl border border-rose-200">
                          <span className="text-[10px] font-bold text-rose-700 pl-1">Hapus draft ini?</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDeleteDraft(draft.id)}
                              className="rounded-lg bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-700 transition disabled:opacity-50"
                            >
                              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Buka Editor Button */}
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              router.push(`/editor/${draft.templateCode}/${draft.id}`);
                            }}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95"
                          >
                            <Edit3 size={13} />
                            <span>Buka Editor</span>
                          </button>

                          {/* Published Live Link */}
                          {isPublished && draft.slug && (
                            <Link
                              href={`/i/${draft.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition"
                              title="Buka Halaman Publik"
                            >
                              <Globe size={13} />
                            </Link>
                          )}

                          {/* Delete Action */}
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(draft.id)}
                            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Hapus draft"
                            aria-label="Hapus draft"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-3.5">
          <span className="text-[11px] font-semibold text-slate-500">
            Total <strong className="text-slate-800">{drafts.length}</strong> undangan tersimpan
          </span>

          <Link
            href="/"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95"
          >
            <Plus size={14} />
            <span>Buat Undangan Baru</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
