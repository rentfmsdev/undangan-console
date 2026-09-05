import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut, Lock } from "lucide-react";
import { getSessionUser } from "@/modules/auth/service";
import { SUPER_ADMIN_EMAIL, ADMIN_EMAILS, isSuperAdminEmail } from "@/modules/admin/auth";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Roots Console | Undangan Studio",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RootsPage() {
  const user = await getSessionUser();

  // Case 1: Pengguna belum login sama sekali
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12 text-slate-100 font-sans">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl text-center">
          {/* Logo Brand */}
          <div className="mx-auto flex justify-center mb-5">
            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 shadow-inner">
              <Image src="/assets/fav.png" width={52} height={52} alt="Undangan Studio" className="h-full w-full object-cover" priority />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 mb-3">
            <Lock size={12} />
            <span>Roots Super Console</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Roots Portal
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Halaman internal untuk administrator <span className="font-mono text-emerald-400 font-semibold">{SUPER_ADMIN_EMAIL}</span> untuk memantau pengguna terdaftar, undangan, dan status pembayaran.
          </p>

          <div className="mt-8">
            <Link
              href="/api/auth/google?returnTo=/roots"
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-sm font-extrabold text-slate-900 shadow-lg shadow-white/5 transition hover:bg-slate-100 hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk dengan Google</span>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Beranda Utama</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Pengguna sudah login, TETAPI BUKAN ardiandra45@gmail.com / ardiandra53@gmail.com (Akses Ditolak)
  if (!isSuperAdminEmail(user.email)) {
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
            Halaman ini dilindungi dan hanya dapat diakses oleh akun super administrator:{" "}
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
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
              >
                <LogOut size={14} />
                <span>Ganti Akun Google</span>
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

  // Case 3: Pengguna terotentikasi dan terverifikasi sebagai admin
  return <AdminDashboardClient initialUser={user} />;
}
