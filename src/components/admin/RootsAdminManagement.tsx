"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  X,
  Dices,
  Shield,
  Clock,
} from "lucide-react";

import {
  isDateInRange,
  formatDateLabel,
} from "@/modules/admin/date-filter";
import { writeClipboardText } from "@/lib/browser-compat";

export type RootAdminItem = {
  id: string;
  userId: string;
  username: string;
  name: string;
  email: string;
  role: "user" | "admin";
  mustChangePassword: boolean;
  failedAttempts: number;
  isLocked: boolean;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
};

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

function generateSecureTempPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export function RootsAdminManagement({
  isSuperAdmin,
  currentUserId,
  startDate,
  endDate,
  onResetDate,
}: {
  isSuperAdmin: boolean;
  currentUserId: string;
  startDate?: string;
  endDate?: string;
  onResetDate?: () => void;
}) {
  const [admins, setAdmins] = useState<RootAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal Tambah Admin
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newTempPassword, setNewTempPassword] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{ username: string; tempPass: string } | null>(null);

  // Modal Reset Password
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<RootAdminItem | null>(null);
  const [resetTempPassword, setResetTempPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ username: string; tempPass: string } | null>(null);

  // Lock / Unlock Action
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/roots/admin-users");
      if (!res.ok) throw new Error("Gagal memuat daftar admin.");
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    void writeClipboardText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openAddModal = () => {
    setNewUsername("");
    setNewName("");
    setNewEmail("");
    setNewTempPassword(generateSecureTempPassword());
    setAddError(null);
    setCreatedResult(null);
    setIsAddOpen(true);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);

    try {
      const res = await fetch("/api/roots/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          name: newName,
          email: newEmail || undefined,
          temporaryPassword: newTempPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || "Gagal menambahkan admin.");
        setAddLoading(false);
        return;
      }

      setCreatedResult({
        username: data.admin.username,
        tempPass: newTempPassword,
      });
      fetchAdmins();
    } catch (err) {
      console.error(err);
      setAddError("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setAddLoading(false);
    }
  };

  const openResetModal = (admin: RootAdminItem) => {
    setSelectedAdmin(admin);
    setResetTempPassword(generateSecureTempPassword());
    setResetError(null);
    setResetResult(null);
    setIsResetOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setResetLoading(true);
    setResetError(null);

    try {
      const res = await fetch(`/api/roots/admin-users/${selectedAdmin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          temporaryPassword: resetTempPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResetError(data.error || "Gagal mereset kata sandi.");
        setResetLoading(false);
        return;
      }

      setResetResult({
        username: selectedAdmin.username,
        tempPass: resetTempPassword,
      });
      fetchAdmins();
    } catch (err) {
      console.error(err);
      setResetError("Terjadi kesalahan sistem.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleToggleLock = async (admin: RootAdminItem) => {
    const action = admin.isLocked ? "unlock" : "lock";
    const confirmText = admin.isLocked
      ? `Buka kunci akun admin "${admin.username}"?`
      : `Kunci akun admin "${admin.username}"? Admin tidak akan bisa masuk hingga dibuka kuncinya.`;

    if (!window.confirm(confirmText)) return;

    setActionLoadingId(admin.id);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/roots/admin-users/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage({ type: "error", text: data.error || "Gagal memperbarui status akun." });
        return;
      }

      setStatusMessage({ type: "success", text: data.message });
      fetchAdmins();
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredAdmins = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return admins.filter((a) => {
      const matchSearch =
        !q ||
        a.username.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q);

      const matchDate = isDateInRange(a.createdAt, startDate, endDate);

      return matchSearch && matchDate;
    });
  }, [admins, searchQuery, startDate, endDate]);

  return (
    <section className="mt-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span>Manajemen Administrator Roots</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar akun yang berwenang mengakses Roots Console menggunakan autentikasi username &amp; kata sandi lokal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAdmins}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
            title="Muat Ulang"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-emerald-400" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-[0.98] cursor-pointer"
            >
              <UserPlus size={14} />
              <span>Tambah Admin Roots</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Status Banner */}
      {statusMessage && (
        <div
          className={`mb-4 flex items-center justify-between rounded-xl p-3 text-xs ${
            statusMessage.type === "success"
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search Filter */}
      <div className="mb-4 relative">
        <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari username, nama admin, atau email internal..."
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

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Username &amp; Tampilan</th>
                <th className="py-3.5 px-4">Email Terdaftar</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4">Percobaan Gagal</th>
                <th className="py-3.5 px-4">Terakhir Masuk</th>
                <th className="py-3.5 px-4">Dibuat Pada</th>
                {isSuperAdmin && <th className="py-3.5 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="py-12 text-center text-slate-500">
                    <p>
                      {searchQuery || startDate || endDate
                        ? "Tidak ada admin yang cocok dengan filter pencarian atau periode tanggal yang dipilih."
                        : "Belum ada admin Roots terdaftar."}
                    </p>
                    {(startDate || endDate) && onResetDate && (
                      <button
                        onClick={onResetDate}
                        className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
                      >
                        Reset Filter Periode Tanggal
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isSelf = admin.userId === currentUserId;
                  const isBootstrap = admin.username.toLowerCase() === "undanganku";

                  return (
                    <tr key={admin.id} className="hover:bg-slate-900/40 transition">
                      {/* Username & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 grid place-items-center font-mono font-bold text-xs text-emerald-400">
                            {admin.username[0]?.toUpperCase() || "A"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-white">{admin.username}</span>
                              {isBootstrap && (
                                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-400 border border-emerald-500/20">
                                  Bootstrap
                                </span>
                              )}
                              {isSelf && (
                                <span className="inline-flex items-center rounded-md bg-cyan-500/10 px-1.5 py-0.2 text-[9px] font-extrabold text-cyan-400 border border-cyan-500/20">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">{admin.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        {admin.email}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {admin.isLocked ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-extrabold text-rose-400 border border-rose-500/20">
                            <Lock size={10} /> Terkunci
                          </span>
                        ) : admin.mustChangePassword ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold text-amber-400 border border-amber-500/20">
                            <KeyRound size={10} /> Wajib Ganti Sandi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={10} /> Aktif
                          </span>
                        )}
                      </td>

                      {/* Failed attempts */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {admin.failedAttempts > 0 ? (
                          <span className="text-amber-400 font-bold">{admin.failedAttempts} kali</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>

                      {/* Last login */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-400">
                        {formatDate(admin.lastLoginAt)}
                      </td>

                      {/* Created at */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-400">
                        {formatDate(admin.createdAt)}
                      </td>

                      {/* Actions */}
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openResetModal(admin)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                              title="Reset kata sandi admin"
                            >
                              <KeyRound size={11} />
                              <span>Reset</span>
                            </button>

                            {!isBootstrap && !isSelf && (
                              <button
                                onClick={() => handleToggleLock(admin)}
                                disabled={actionLoadingId === admin.id}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 ${
                                  admin.isLocked
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                    : "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                                }`}
                                title={admin.isLocked ? "Buka kunci akun" : "Kunci akun"}
                              >
                                {admin.isLocked ? <Unlock size={11} /> : <Lock size={11} />}
                                <span>{admin.isLocked ? "Buka" : "Kunci"}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Tambah Admin Roots */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus size={16} className="text-emerald-400" />
                <span>Tambah Administrator Roots</span>
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {createdResult ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                    <CheckCircle2 size={16} />
                    <span>Akun Admin Berhasil Dibuat!</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                    Harap simpan dan berikan kata sandi sementara berikut kepada admin. Kata sandi ini hanya ditampilkan sekali:
                  </p>

                  <div className="mt-3 rounded-lg border border-emerald-500/30 bg-slate-950 p-2.5 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Username:</span>
                      <span className="font-mono text-xs text-white font-bold">{createdResult.username}</span>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Kata Sandi Sementara:</span>
                      <span className="font-mono text-xs text-amber-300 font-bold">{createdResult.tempPass}</span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(createdResult.tempPass, "tempPass")}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 transition hover:bg-emerald-400 cursor-pointer"
                    >
                      {copiedKey === "tempPass" ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey === "tempPass" ? "Disalin" : "Salin"}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddOpen(false)}
                  className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700 cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateAdmin} className="space-y-3.5 text-left">
                {addError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{addError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                    placeholder="contoh: ardi.admin"
                    disabled={addLoading}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-medium text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Hanya huruf kecil, angka, garis bawah, atau strip (3-30 karakter).</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nama Tampilan
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="contoh: Ardiandra Pratama"
                    disabled={addLoading}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-medium text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Kosongkan jika menggunakan domain internal"
                    disabled={addLoading}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-medium text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Kata Sandi Sementara
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewTempPassword(generateSecureTempPassword())}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Dices size={12} />
                      <span>Acak Sandi</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newTempPassword}
                    onChange={(e) => setNewTempPassword(e.target.value)}
                    disabled={addLoading}
                    className="w-full font-mono rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-medium text-amber-300 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Admin wajib mengganti sandi ini saat pertama kali login.</span>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    disabled={addLoading}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
                  >
                    {addLoading ? "Menyimpan..." : "Buat Akun Admin"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Reset Password */}
      {isResetOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound size={16} className="text-amber-400" />
                <span>Reset Kata Sandi Admin</span>
              </h3>
              <button
                onClick={() => setIsResetOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {resetResult ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                    <CheckCircle2 size={16} />
                    <span>Kata Sandi Berhasil Direset!</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                    Kata sandi baru untuk <span className="font-bold font-mono">{resetResult.username}</span>:
                  </p>

                  <div className="mt-3 rounded-lg border border-emerald-500/30 bg-slate-950 p-2.5 flex items-center justify-between">
                    <span className="font-mono text-xs text-amber-300 font-bold">{resetResult.tempPass}</span>
                    <button
                      onClick={() => copyToClipboard(resetResult.tempPass, "resetPass")}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 transition hover:bg-emerald-400 cursor-pointer"
                    >
                      {copiedKey === "resetPass" ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey === "resetPass" ? "Disalin" : "Salin"}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsResetOpen(false)}
                  className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700 cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3.5 text-left">
                {resetError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Akun Target:</span>
                  <span className="font-mono text-white font-bold">{selectedAdmin.username}</span> ({selectedAdmin.name})
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Kata Sandi Sementara Baru
                    </label>
                    <button
                      type="button"
                      onClick={() => setResetTempPassword(generateSecureTempPassword())}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Dices size={12} />
                      <span>Acak Sandi</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={resetTempPassword}
                    onChange={(e) => setResetTempPassword(e.target.value)}
                    disabled={resetLoading}
                    className="w-full font-mono rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-medium text-amber-300 focus:border-amber-500 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Admin akan diwajibkan mengganti kata sandi ini saat masuk berikutnya.
                  </span>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(false)}
                    disabled={resetLoading}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 cursor-pointer"
                  >
                    {resetLoading ? "Menyimpan..." : "Reset Kata Sandi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
