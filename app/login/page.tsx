"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Heart,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
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
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnTo = searchParams.get("returnTo") || "/";
  const errorParam = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [showDirectModal, setShowDirectModal] = useState(false);

  const handleGoogleOAuth = () => {
    setIsLoading(true);
    router.push(`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/google/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customEmail,
          name: customEmail.split("@")[0],
          returnTo,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(data.returnTo || "/");
        router.refresh();
      } else {
        alert(data.error || "Gagal masuk");
        setIsLoading(false);
      }
    } catch (err) {
      alert("Terjadi kesalahan");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      {/* Navbar Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="block text-sm font-extrabold text-slate-900 leading-tight">Undangan Studio</span>
              <span className="block text-[10px] font-semibold text-slate-500">Marketplace & Console</span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            &larr; Kembali ke Marketplace
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 shadow-xl shadow-slate-200/50">
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
                <Sparkles size={24} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Selamat Datang
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Masuk untuk mulai mengkustomisasi template undangan, menyimpan draf, dan mengelola buku tamu.
              </p>
            </div>

            {errorParam && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>Terjadi kendala autentikasi. Silakan coba lagi atau gunakan login cepat.</span>
              </div>
            )}

            {/* Google Single-Action Button */}
            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={handleGoogleOAuth}
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:shadow active:scale-95 disabled:opacity-60"
              >
                {isLoading ? (
                  <LoaderCircle size={20} className="animate-spin text-blue-600" />
                ) : (
                  <GoogleIcon />
                )}
                <span>Lanjutkan dengan Google</span>
              </button>

              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Single Action Auth
                </span>
              </div>

              {/* Direct Instant Email Sign-In (1-Click Signup/Login) */}
              <form onSubmit={handleQuickLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Atau masuk dengan email langsung
                  </label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !customEmail}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? <LoaderCircle size={15} className="animate-spin" /> : <Zap size={14} />}
                  <span>Masuk / Daftar Otomatis</span>
                </button>
              </form>
            </div>

            {/* Feature points */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Keuntungan akun:
              </p>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-blue-600 shrink-0" />
                  <span>1 Action: otomatis buat akun jika belum terdaftar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-blue-600 shrink-0" />
                  <span>Draf template tersimpan di cloud & database MySQL</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={14} className="text-blue-600 shrink-0" />
                  <span>Kelola ucapan, RSVP, dan buku tamu online</span>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Dengan melanjutkan, Anda menyetujui ketentuan layanan dan privasi Undangan Studio.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-50 text-xs text-slate-500">Memuat login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
