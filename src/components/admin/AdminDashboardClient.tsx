"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  CreditCard,
  Mail,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  Copy,
  Check,
} from "lucide-react";
import type { AuthUser } from "@/modules/auth/service";

type AdminMetrics = {
  totalUsers: number;
  totalInvitations: number;
  publishedInvitations: number;
  draftInvitations: number;
  totalPayments: number;
  paidPaymentsCount: number;
  pendingPaymentsCount: number;
  totalRevenue: number;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  createdAt: string;
  totalInvitations: number;
  paidInvitations: number;
};

type AdminInvitation = {
  id: string;
  userId?: string | null;
  title: string;
  slug?: string | null;
  subdomain?: string | null;
  publishMode?: "path" | "subdomain" | "custom_domain" | null;
  status: "draft" | "published" | "custom" | "archived";
  templateId: string;
  templateName: string;
  templateCategory: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string | null;
  userEmail?: string | null;
  userAvatar?: string | null;
  payment?: {
    id: string;
    amount: number;
    status: "pending" | "paid" | "expired" | "failed";
    method: string;
    channel: string;
    paidAt?: string | null;
    createdAt: string;
  } | null;
  paymentStatus: "paid" | "pending" | "unpaid";
};

type AdminPayment = {
  id: string;
  invitationId: string;
  userId: string;
  referenceId?: string | null;
  amount: number;
  currency: string;
  mode: string;
  identifier: string;
  paymentMethod: string;
  paymentChannel: string;
  status: "pending" | "paid" | "expired" | "failed";
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  paidAt?: string | null;
  createdAt: string;
  invitationTitle?: string | null;
  invitationSlug?: string | null;
  userName?: string | null;
  userEmail?: string | null;
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function AdminDashboardClient({ initialUser }: { initialUser: AuthUser }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"invitations" | "users" | "payments">("invitations");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [invitationsList, setInvitationsList] = useState<AdminInvitation[]>([]);
  const [paymentsList, setPaymentsList] = useState<AdminPayment[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/roots/overview");
      if (!res.ok) throw new Error("Gagal mengambil data admin.");
      const data = await res.json();
      setMetrics(data.metrics);
      setUsersList(data.users || []);
      setInvitationsList(data.invitations || []);
      setPaymentsList(data.payments || []);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Invitations
  const filteredInvitations = useMemo(() => {
    return invitationsList.filter((inv) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        inv.title.toLowerCase().includes(q) ||
        (inv.slug && inv.slug.toLowerCase().includes(q)) ||
        (inv.userName && inv.userName.toLowerCase().includes(q)) ||
        (inv.userEmail && inv.userEmail.toLowerCase().includes(q)) ||
        inv.templateName.toLowerCase().includes(q);

      const matchPayment =
        paymentFilter === "all" || inv.paymentStatus === paymentFilter;

      const matchStatus =
        statusFilter === "all" || inv.status === statusFilter;

      return matchSearch && matchPayment && matchStatus;
    });
  }, [invitationsList, searchQuery, paymentFilter, statusFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const q = searchQuery.toLowerCase();
      return (
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    });
  }, [usersList, searchQuery]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return paymentsList.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (p.referenceId && p.referenceId.toLowerCase().includes(q)) ||
        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
        (p.customerEmail && p.customerEmail.toLowerCase().includes(q)) ||
        (p.invitationTitle && p.invitationTitle.toLowerCase().includes(q)) ||
        (p.identifier && p.identifier.toLowerCase().includes(q));

      const matchStatus =
        paymentFilter === "all" || p.status === paymentFilter;

      return matchSearch && matchStatus;
    });
  }, [paymentsList, searchQuery, paymentFilter]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-800 transition hover:scale-105">
              <Image src="/assets/fav.png" width={40} height={40} alt="Undangan Studio" className="h-full w-full object-cover" priority />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-brand text-2xl font-bold text-white tracking-tight leading-none">
                  Undangan Studio
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={12} /> Roots Super Admin
                </span>
              </div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Roots Console &amp; Analytics
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
              title="Perbarui Data"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin text-emerald-400" : ""} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* Admin User Info */}
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-800 border border-emerald-500/30">
                {initialUser.avatarUrl ? (
                  <img src={initialUser.avatarUrl} alt={initialUser.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full grid place-items-center font-bold text-xs text-emerald-400">
                    {initialUser.name[0]?.toUpperCase() || "A"}
                  </div>
                )}
              </div>
              <div className="hidden md:block text-left text-xs leading-tight">
                <span className="block font-bold text-white truncate max-w-[140px]">{initialUser.name}</span>
                <span className="block text-[11px] text-emerald-400 font-mono">{initialUser.email}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="grid h-9 w-9 place-items-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 transition hover:bg-rose-500/20 hover:text-rose-300"
              title="Keluar"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {/* Metric Cards Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Users */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pengguna</span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-blue-400">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white">
                {metrics?.totalUsers ?? 0}
              </span>
              <span className="text-xs text-slate-400">terdaftar</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
              Sinkron dengan akun Google
            </p>
          </div>

          {/* Card 2: Invitations */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Undangan Dibuat</span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Mail size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white">
                {metrics?.totalInvitations ?? 0}
              </span>
              <span className="text-xs text-slate-400">total draft</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 size={12} /> {metrics?.publishedInvitations ?? 0} published
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{metrics?.draftInvitations ?? 0} draft</span>
            </div>
          </div>

          {/* Card 3: Payments Count */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Transaksi Pembayaran</span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
                <CreditCard size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white">
                {metrics?.paidPaymentsCount ?? 0}
              </span>
              <span className="text-xs text-emerald-400 font-bold">Lunas (Paid)</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
              <span className="text-amber-400">{metrics?.pendingPaymentsCount ?? 0} pending</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-500">{metrics?.totalPayments ?? 0} total rekaman</span>
            </div>
          </div>

          {/* Card 4: Revenue */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pendapatan</span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/10 text-purple-400">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-400">
                {formatRupiah(metrics?.totalRevenue ?? 0)}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-400" />
              Dari seluruh pembayaran berstatus Paid
            </p>
          </div>
        </section>

        {/* Tab Selection & Search Filters Bar */}
        <section className="mt-8 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => {
                  setActiveTab("invitations");
                  setPaymentFilter("all");
                }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                  activeTab === "invitations"
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Mail size={14} />
                <span>Semua Undangan ({invitationsList.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("users");
                  setPaymentFilter("all");
                }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                  activeTab === "users"
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Users size={14} />
                <span>Pengguna Terdaftar ({usersList.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("payments");
                  setPaymentFilter("all");
                }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                  activeTab === "payments"
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CreditCard size={14} />
                <span>Riwayat Pembayaran ({paymentsList.length})</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-700 hover:text-white"
              >
                <span>Lihat Beranda</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "invitations"
                    ? "Cari judul undangan, slug, email pembuat, atau template..."
                    : activeTab === "users"
                    ? "Cari nama pengguna, email, atau no handphone..."
                    : "Cari ID transaksi, referensi, nama customer, atau judul undangan..."
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Status Filter for Invitations & Payments */}
            {activeTab === "invitations" && (
              <div className="flex items-center gap-2">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs font-medium text-slate-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">Semua Status Bayar</option>
                  <option value="paid">✅ Lunas (Paid / Published)</option>
                  <option value="pending">⏳ Menunggu Bayar (Pending)</option>
                  <option value="unpaid">⚪ Draft / Belum Bayar</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs font-medium text-slate-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">Semua Status Undangan</option>
                  <option value="published">Terbit (Published)</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Diarsipkan</option>
                </select>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="flex items-center gap-2">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs font-medium text-slate-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">Semua Status Transaksi</option>
                  <option value="paid">Paid (Lunas)</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Tab 1: Semua Undangan Content */}
        {activeTab === "invitations" && (
          <section className="mt-6">
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4">Undangan</th>
                      <th className="py-3.5 px-4">Template</th>
                      <th className="py-3.5 px-4">Pemilik (User)</th>
                      <th className="py-3.5 px-4">Status Undangan</th>
                      <th className="py-3.5 px-4">Status Pembayaran</th>
                      <th className="py-3.5 px-4">Waktu Buat / Update</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredInvitations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          {searchQuery || paymentFilter !== "all"
                            ? "Tidak ada undangan yang cocok dengan filter pencarian."
                            : "Belum ada undangan yang dibuat."}
                        </td>
                      </tr>
                    ) : (
                      filteredInvitations.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-900/40 transition">
                          {/* Title & Slug */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white max-w-[220px] truncate" title={inv.title}>
                              {inv.title || "Tanpa Judul"}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              {inv.slug ? (
                                <span className="font-mono text-emerald-400">/i/{inv.slug}</span>
                              ) : (
                                <span className="text-slate-500">Belum ada slug</span>
                              )}
                              {inv.slug && (
                                <button
                                  onClick={() => copyToClipboard(`/i/${inv.slug}`, `slug-${inv.id}`)}
                                  className="text-slate-500 hover:text-white"
                                  title="Salin path slug"
                                >
                                  {copiedId === `slug-${inv.id}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Template */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-200 block">{inv.templateName}</span>
                            <span className="text-[10px] text-slate-500 capitalize">{inv.templateCategory}</span>
                          </td>

                          {/* Owner */}
                          <td className="py-3.5 px-4">
                            {inv.userName || inv.userEmail ? (
                              <div>
                                <span className="font-semibold text-slate-300 block">{inv.userName || "User"}</span>
                                <span className="text-[11px] text-slate-500 font-mono">{inv.userEmail}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Anonim / Tanpa Akun</span>
                            )}
                          </td>

                          {/* Invitation Status */}
                          <td className="py-3.5 px-4">
                            {inv.status === "published" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Published
                              </span>
                            ) : inv.status === "draft" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-400 border border-slate-700">
                                Draft
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
                                {inv.status}
                              </span>
                            )}
                          </td>

                          {/* Payment Status */}
                          <td className="py-3.5 px-4">
                            {inv.paymentStatus === "paid" ? (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 size={12} /> LUNAS (PAID)
                                </span>
                                {inv.payment && (
                                  <span className="block text-[10px] text-slate-400 mt-0.5">
                                    {formatRupiah(inv.payment.amount)} · {inv.payment.channel}
                                  </span>
                                )}
                              </div>
                            ) : inv.paymentStatus === "pending" ? (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-400 border border-amber-500/30">
                                  <Clock size={12} /> MENUNGGU BAYAR
                                </span>
                                {inv.payment && (
                                  <span className="block text-[10px] text-slate-400 mt-0.5">
                                    {formatRupiah(inv.payment.amount)} · {inv.payment.channel}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700/60">
                                Belum Bayar
                              </span>
                            )}
                          </td>

                          {/* Created / Updated */}
                          <td className="py-3.5 px-4 text-[11px] text-slate-400">
                            <div>{formatDate(inv.createdAt)}</div>
                            <span className="text-[10px] text-slate-500">Up: {formatDate(inv.updatedAt)}</span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {inv.slug && (
                                <Link
                                  href={`/i/${inv.slug}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                                  title="Buka Undangan Online"
                                >
                                  <span>Buka</span>
                                  <ExternalLink size={11} />
                                </Link>
                              )}
                              <Link
                                href={`/editor/${inv.templateId}/${inv.id}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                                title="Buka di Editor"
                              >
                                <span>Editor</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: Pengguna Terdaftar Content */}
        {activeTab === "users" && (
          <section className="mt-6">
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4">Pengguna</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Jumlah Undangan</th>
                      <th className="py-3.5 px-4">Undangan Lunas</th>
                      <th className="py-3.5 px-4">Bergabung Sejak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          Tidak ada pengguna yang cocok.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/40 transition">
                          {/* Name & Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt={u.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full grid place-items-center font-bold text-xs text-slate-400">
                                    {u.name[0]?.toUpperCase() || "U"}
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{u.name}</span>
                                {u.phone && <span className="text-[10px] text-slate-500">{u.phone}</span>}
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {u.email}
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">
                            {u.role === "admin" || u.email.toLowerCase() === "ardiandra45@gmail.com" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-extrabold text-purple-400 border border-purple-500/20">
                                <ShieldCheck size={11} /> Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                Pengguna
                              </span>
                            )}
                          </td>

                          {/* Total Undangan */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white">{u.totalInvitations}</span>
                            <span className="text-slate-500 text-[11px]"> draft</span>
                          </td>

                          {/* Paid Invitations */}
                          <td className="py-3.5 px-4">
                            {u.paidInvitations > 0 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                <CheckCircle2 size={12} /> {u.paidInvitations} lunas
                              </span>
                            ) : (
                              <span className="text-slate-500">0</span>
                            )}
                          </td>

                          {/* Joined Date */}
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {formatDate(u.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: Riwayat Pembayaran Content */}
        {activeTab === "payments" && (
          <section className="mt-6">
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4">ID Transaksi / Ref</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Undangan</th>
                      <th className="py-3.5 px-4">Nominal</th>
                      <th className="py-3.5 px-4">Metode / Channel</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Waktu Bayar / Dibuat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          {searchQuery || paymentFilter !== "all"
                            ? "Tidak ada transaksi yang cocok dengan filter."
                            : "Belum ada riwayat transaksi pembayaran tercatat di sistem."}
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-900/40 transition">
                          {/* Ref ID */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-white block">
                              {p.referenceId || p.id.slice(0, 8)}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ID: {p.id.slice(0, 12)}...
                            </span>
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-200 block">
                              {p.customerName || p.userName || "Customer"}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {p.customerEmail || p.userEmail || "-"}
                            </span>
                          </td>

                          {/* Invitation */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-300 block max-w-[180px] truncate">
                              {p.invitationTitle || "Undangan"}
                            </span>
                            {p.invitationSlug ? (
                              <Link
                                href={`/i/${p.invitationSlug}`}
                                target="_blank"
                                className="text-[10px] text-emerald-400 font-mono hover:underline inline-flex items-center gap-0.5"
                              >
                                /i/{p.invitationSlug} <ExternalLink size={9} />
                              </Link>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">{p.identifier}</span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 font-extrabold text-emerald-400">
                            {formatRupiah(p.amount)}
                          </td>

                          {/* Method / Channel */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-300 block">{p.paymentChannel || "QRIS"}</span>
                            <span className="text-[10px] text-slate-500">{p.paymentMethod}</span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {p.status === "paid" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 size={12} /> PAID
                              </span>
                            ) : p.status === "pending" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20">
                                <Clock size={12} /> PENDING
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-400 border border-rose-500/20">
                                <AlertCircle size={12} /> {p.status.toUpperCase()}
                              </span>
                            )}
                          </td>

                          {/* Time */}
                          <td className="py-3.5 px-4 text-[11px] text-slate-400">
                            {p.paidAt ? (
                              <div>
                                <span className="text-emerald-400 font-semibold block">Bayar: {formatDate(p.paidAt)}</span>
                                <span className="text-[10px] text-slate-500">Order: {formatDate(p.createdAt)}</span>
                              </div>
                            ) : (
                              <div>{formatDate(p.createdAt)}</div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
