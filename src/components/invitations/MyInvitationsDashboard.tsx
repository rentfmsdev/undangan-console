"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FilePenLine,
  Layers,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAuthDropdown, type AuthUser } from "@/components/auth/UserAuthDropdown";
import { buildInvitationUrl, buildSubdomainUrl } from "@/lib/app-url";

type Draft = {
  id: string;
  title: string;
  templateCode: string;
  templateName: string;
  category: string;
  coverImage: string;
  status: "draft" | "published" | "custom" | "archived";
  slug: string | null;
  subdomain: string | null;
  updatedAt: string;
  isCollaborator?: boolean;
  collabRole?: string;
  sharedBy?: {
    id: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
  } | null;
};

type PendingInvitation = {
  id: string;
  invitationId: string;
  invitationTitle: string;
  role: "editor" | "viewer";
  status: "pending" | "expired";
  isExpired: boolean;
  templateCode: string;
  templateName: string;
  expiresAt: string | null;
  createdAt: string;
  inviter: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

const statusMeta = {
  draft: { label: "Draf", tone: "neutral" as const },
  published: { label: "Diterbitkan", tone: "success" as const },
  custom: { label: "Menunggu alamat", tone: "warning" as const },
  archived: { label: "Kedaluwarsa", tone: "danger" as const },
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function MyInvitationsDashboard({ initialUser }: { initialUser?: AuthUser | null }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(initialUser ?? null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [draftsError, setDraftsError] = useState("");

  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const [selectedTab, setSelectedTab] = useState<"all" | "mine" | "collab" | "invites">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
    draftId?: string;
    templateCode?: string;
  } | null>(null);

  // Sync user if not provided initially
  useEffect(() => {
    if (!initialUser) {
      fetch("/api/auth/me", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) setCurrentUser(data.user);
        })
        .catch(() => {});
    }
  }, [initialUser]);

  // Load user drafts
  const loadDrafts = async () => {
    try {
      setDraftsError("");
      const response = await fetch("/api/drafts", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Gagal memuat undangan.");
      setDrafts(payload.drafts ?? []);
    } catch (err) {
      setDraftsError(err instanceof Error ? err.message : "Gagal memuat undangan.");
    } finally {
      setLoadingDrafts(false);
    }
  };

  // Load pending collaborator invitations
  const loadPendingInvitations = async () => {
    try {
      const response = await fetch("/api/collaboration/invitations", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      if (Array.isArray(payload.invitations)) {
        setPendingInvitations(payload.invitations);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    void loadDrafts();
    void loadPendingInvitations();
  }, []);

  // Handle Accept Collaborator Invitation
  const handleAcceptInvitation = async (invitation: PendingInvitation) => {
    setActionInProgress(invitation.id);
    setFeedback(null);
    try {
      const response = await fetch("/api/collaboration/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId: invitation.id,
          action: "accept",
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Gagal menerima undangan kolaborasi.");
      }

      // Remove from pending
      setPendingInvitations((prev) => prev.filter((item) => item.id !== invitation.id));

      // Reload drafts so the new invitation appears immediately
      await loadDrafts();

      setFeedback({
        tone: "success",
        message: `Berhasil menerima undangan "${invitation.invitationTitle}"! Anda sekarang dapat mengedit undangan ini.`,
        draftId: invitation.invitationId,
        templateCode: invitation.templateCode,
      });
    } catch (err) {
      setFeedback({
        tone: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan saat menerima undangan.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Decline Collaborator Invitation
  const handleDeclineInvitation = async (invitation: PendingInvitation) => {
    if (!confirm(`Apakah Anda yakin ingin menolak undangan kolaborasi "${invitation.invitationTitle}"?`)) {
      return;
    }

    setActionInProgress(invitation.id);
    setFeedback(null);
    try {
      const response = await fetch("/api/collaboration/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId: invitation.id,
          action: "decline",
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Gagal menolak undangan.");
      }

      setPendingInvitations((prev) => prev.filter((item) => item.id !== invitation.id));
      setFeedback({
        tone: "success",
        message: `Undangan "${invitation.invitationTitle}" telah ditolak.`,
      });
    } catch (err) {
      setFeedback({
        tone: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan saat menolak undangan.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const total = drafts.length;
    const published = drafts.filter((d) => d.status === "published").length;
    const draftCount = drafts.filter((d) => d.status === "draft").length;
    const shared = drafts.filter((d) => d.isCollaborator).length;
    const mine = drafts.filter((d) => !d.isCollaborator).length;
    return { total, published, draftCount, shared, mine };
  }, [drafts]);

  // Filtered drafts based on tab & search
  const filteredDrafts = useMemo(() => {
    return drafts.filter((item) => {
      // Tab filter
      if (selectedTab === "mine" && item.isCollaborator) return false;
      if (selectedTab === "collab" && !item.isCollaborator) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesTemplate = item.templateName.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        return matchesTitle || matchesTemplate || matchesCategory;
      }

      return true;
    });
  }, [drafts, selectedTab, searchQuery]);

  const summary = [
    { label: "Total Undangan", value: stats.total, Icon: Layers, color: "text-slate-900", bg: "bg-slate-100" },
    { label: "Diterbitkan", value: stats.published, Icon: Check, color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "Draf Masih Diedit", value: stats.draftCount, Icon: FilePenLine, color: "text-amber-700", bg: "bg-amber-50" },
    { label: "Proyek Kolaborasi", value: stats.shared, Icon: Users, color: "text-blue-700", bg: "bg-blue-50" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* STICKY TOP NAVBAR */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur px-3 py-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          {/* Left: Back to Home + Brand */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="ui-interactive inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 sm:px-3 sm:py-2"
              title="Kembali ke Halaman Depan"
            >
              <ArrowLeft size={15} className="text-slate-500 shrink-0" />
              <span className="font-bold">Beranda</span>
            </Link>

            <div className="h-5 w-px bg-slate-200 hidden xs:block" />

            <Link href="/" className="flex items-center gap-2 group">
              <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg transition group-hover:scale-105">
                <Image src="/assets/fav.png" width={32} height={32} alt="Undangan Studio" className="h-full w-full object-cover" priority />
              </div>
              <div className="hidden sm:block">
                <span className="block text-xs font-extrabold text-slate-900 leading-tight">Undangan Studio</span>
                <span className="block text-[10px] font-semibold text-slate-500">Dashboard Pengguna</span>
              </div>
            </Link>
          </div>

          {/* Right: Buat Undangan + User Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/#templates"
              className="ui-interactive inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
            >
              <Plus size={15} />
              <span className="hidden xs:inline">Buat Undangan</span>
              <span className="xs:hidden">Buat</span>
            </Link>

            <UserAuthDropdown
              user={currentUser}
              onLoginClick={() => router.push("/login?returnTo=%2Fundangan-saya")}
              onLogout={() => setCurrentUser(null)}
              onMyInvitationsClick={() => {}}
            />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT WRAPPER */}
      <main className="mx-auto max-w-6xl px-3.5 py-6 sm:px-8 sm:py-8">
        {/* PAGE TITLE BANNER */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase text-emerald-800">
              <Layers size={12} className="text-emerald-600" />
              <span>Dashboard Undangan</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Undangan Saya
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
              Kelola draf, lihat status publikasi, dan tanggapi ajakan kolaborasi dalam satu tempat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft size={14} /> Ke Halaman Depan
            </Link>
          </div>
        </div>

        {/* FEEDBACK TOAST / ALERT */}
        {feedback && (
          <div
            className={`mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl p-4 text-xs font-semibold shadow-xs transition-all ${
              feedback.tone === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.tone === "success" ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <XCircle size={18} className="text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {feedback.draftId && feedback.templateCode && (
                <Link
                  href={`/editor/${feedback.templateCode}/${feedback.draftId}`}
                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                >
                  Buka Editor Sekarang &rarr;
                </Link>
              )}
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                aria-label="Tutup pesan"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* PENDING COLLABORATOR INVITATIONS SECTION */}
        {pendingInvitations.length > 0 && (
          <section className="mt-6">
            <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-100/30 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Undangan Kolaborasi Masuk ({pendingInvitations.length})
                  </h2>
                </div>
                <p className="text-[11px] font-semibold text-amber-800">
                  Anda diundang untuk ikut menyunting atau melihat undangan di bawah ini:
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {pendingInvitations.map((inv) => {
                  const isProcessing = actionInProgress === inv.id;
                  return (
                    <div
                      key={inv.id}
                      className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-white p-4 shadow-2xs transition hover:shadow-md"
                    >
                      <div>
                        {/* Inviter Info */}
                        <div className="flex items-center gap-2.5">
                          {inv.inviter.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={inv.inviter.avatarUrl}
                              alt={inv.inviter.name}
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              className="h-8 w-8 rounded-full border border-slate-200 object-cover shrink-0"
                            />
                          ) : (
                            <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white shrink-0">
                              {inv.inviter.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-900">
                              {inv.inviter.name}
                            </p>
                            <p className="truncate text-[10px] text-slate-500">
                              {inv.inviter.email}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              inv.role === "editor"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            <ShieldCheck size={11} /> {inv.role}
                          </span>
                        </div>

                        {/* Title & Template */}
                        <div className="mt-3 rounded-xl bg-slate-50 p-2.5">
                          <h3 className="text-xs font-extrabold text-slate-900 truncate">
                            {inv.invitationTitle}
                          </h3>
                          <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                            Template: {inv.templateName}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleAcceptInvitation(inv)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50 active:scale-95"
                        >
                          {isProcessing ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <UserCheck size={14} />
                          )}
                          <span>Terima Undangan</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleDeclineInvitation(inv)}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-2xs transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 active:scale-95"
                        >
                          <X size={14} />
                          <span>Tolak</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* SUMMARY STATS GRID */}
        <section className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {summary.map(({ label, value, Icon, color, bg }) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs transition hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <span className={`grid h-8 w-8 place-items-center rounded-xl ${bg} ${color}`}>
                  <Icon size={16} />
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {value}
                </span>
              </div>
              <p className="mt-2.5 text-[11px] sm:text-xs font-semibold text-slate-500">
                {label}
              </p>
            </article>
          ))}
        </section>

        {/* CONTROLS: TABS & SEARCH */}
        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
              <button
                type="button"
                onClick={() => setSelectedTab("all")}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedTab === "all"
                    ? "bg-white text-slate-950 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua ({stats.total})
              </button>

              <button
                type="button"
                onClick={() => setSelectedTab("mine")}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedTab === "mine"
                    ? "bg-white text-slate-950 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Milik Saya ({stats.mine})
              </button>

              <button
                type="button"
                onClick={() => setSelectedTab("collab")}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedTab === "collab"
                    ? "bg-white text-slate-950 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Kolaborasi ({stats.shared})
              </button>

              {pendingInvitations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTab("invites")}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    selectedTab === "invites"
                      ? "bg-amber-400 text-amber-950 shadow-xs"
                      : "text-amber-800 hover:bg-amber-100/50"
                  }`}
                >
                  <span>Undangan Masuk</span>
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-rose-600 text-[9px] font-extrabold text-white">
                    {pendingInvitations.length}
                  </span>
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul undangan..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* DRAFTS LIST OR INVITES TAB */}
          <div className="mt-5">
            {selectedTab === "invites" ? (
              // Specific Invites Tab View
              <div>
                {pendingInvitations.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                    <h3 className="mt-3 text-sm font-bold text-slate-900">Tidak ada undangan kolaborasi pending</h3>
                    <p className="mt-1 text-xs text-slate-500">Semua undangan kolaborasi telah Anda tanggapi.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {pendingInvitations.map((inv) => (
                      <div key={inv.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{inv.invitationTitle}</h4>
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            {inv.role}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Dari: {inv.inviter.name} ({inv.inviter.email})</p>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAcceptInvitation(inv)}
                            className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            Terima
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineInvitation(inv)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                          >
                            Tolak
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : loadingDrafts ? (
              <div className="grid min-h-60 place-items-center rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                <span className="flex flex-col items-center gap-3">
                  <LoaderCircle className="animate-spin text-emerald-600" size={24} />
                  <span className="font-semibold text-xs text-slate-600">Memuat daftar undangan Anda…</span>
                </span>
              </div>
            ) : draftsError ? (
              <div className="rounded-2xl bg-rose-50 p-4 text-xs sm:text-sm font-semibold text-rose-700 border border-rose-200">
                {draftsError}
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 sm:p-14 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 mx-auto">
                  <Layers size={22} />
                </div>
                <h3 className="mt-4 text-sm sm:text-base font-extrabold text-slate-900">
                  {searchQuery ? "Tidak ada undangan yang cocok" : "Belum ada undangan"}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `Tidak ditemukan undangan dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                    : "Pilih dari puluhan template cantik kami dan mulai buat undangan pertama Anda dalam hitungan menit."}
                </p>
                {!searchQuery && (
                  <div className="mt-5">
                    <Link
                      href="/#templates"
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                    >
                      <Plus size={15} /> Jelajahi Template & Buat
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              // RESPONSIVE CARDS GRID
              <div className="grid gap-3.5 sm:gap-4 md:grid-cols-2">
                {filteredDrafts.map((draft) => {
                  const status = statusMeta[draft.status] ?? { label: draft.status, tone: "neutral" as const };
                  const liveUrl = draft.slug
                    ? buildInvitationUrl(draft.slug)
                    : draft.subdomain
                    ? buildSubdomainUrl(draft.subdomain)
                    : null;

                  return (
                    <article
                      key={draft.id}
                      className="ui-interactive group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs transition hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex gap-3.5">
                        {/* Cover Thumbnail */}
                        <div className="relative h-28 w-20 sm:h-32 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200/80">
                          <Image
                            src={draft.coverImage}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 80px, 96px"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="truncate text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                                {draft.title}
                              </h3>
                              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                            </div>

                            <p className="mt-1 truncate text-[11px] sm:text-xs font-semibold text-slate-500">
                              {draft.templateName} · <span className="capitalize">{draft.category}</span>
                            </p>

                            {/* Collaborator Badge */}
                            {draft.isCollaborator && (
                              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                                  <Users size={11} />
                                  <span>Kolaborasi</span>
                                  {draft.collabRole && <span className="capitalize">({draft.collabRole})</span>}
                                </span>
                                {draft.sharedBy?.name && (
                                  <span className="text-[10px] text-slate-500 truncate">
                                    oleh {draft.sharedBy.name}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-2 text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1">
                            <CalendarDays size={12} className="shrink-0" />
                            <span>Diperbarui {dateFormatter.format(new Date(draft.updatedAt))}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="mt-3.5 flex items-center gap-2 pt-3 border-t border-slate-100">
                        <Link
                          href={`/editor/${draft.templateCode}/${draft.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800 active:scale-98"
                        >
                          <FilePenLine size={13} />
                          <span>Buka Editor</span>
                        </Link>

                        {liveUrl && (
                          <a
                            href={liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-950 active:scale-98"
                            title="Buka tautan undangan langsung"
                          >
                            <ExternalLink size={13} />
                            <span className="hidden xs:inline">Lihat Web</span>
                            <span className="xs:hidden">Lihat</span>
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
