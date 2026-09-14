import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { getAdminSession, ADMIN_EMAILS } from "@/modules/admin/auth";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { RootsLoginForm, RootsChangePasswordForm } from "@/components/admin/RootsAuthPortal";

export const metadata: Metadata = {
  title: "Roots Console | Undangan Studio",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RootsPage() {
  const { user, isAuthorized, isSuperAdmin, mustChangePassword, username } = await getAdminSession();

  // Case 1: Pengguna belum login
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12 text-slate-100 font-sans">
        <RootsLoginForm />
      </div>
    );
  }

  // Case 2: Pengguna login tetapi BUKAN admin / akun terkunci (403 Forbidden)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12 text-slate-100 font-sans">
        <div className="w-full max-w-md rounded-3xl border border-rose-500/20 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-5">
            <ShieldAlert size={32} />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400 mb-3">
            <span>403 Forbidden</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            Akses Terbatas
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Halaman ini dilindungi dan hanya dapat diakses oleh akun administrator Roots terdaftar atau super admin Google:{" "}
            <span className="font-mono font-bold text-emerald-400">{ADMIN_EMAILS.join(", ")}</span>.
          </p>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 text-left text-xs">
            <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Akun Anda Saat Ini:</span>
            <span className="font-mono text-rose-400 font-semibold block truncate mt-0.5">{user.email}</span>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white cursor-pointer"
              >
                <LogOut size={14} />
                <span>Ganti Akun / Keluar</span>
              </button>
            </form>

            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-2 text-xs font-bold text-slate-400 transition hover:text-white"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Beranda Utama</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Admin wajib mengganti kata sandi sebelum mengakses dashboard
  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12 text-slate-100 font-sans">
        <RootsChangePasswordForm username={username} />
      </div>
    );
  }

  // Case 4: Pengguna terotentikasi penuh dan terotorisasi
  return <AdminDashboardClient initialUser={user} isSuperAdmin={isSuperAdmin} />;
}
