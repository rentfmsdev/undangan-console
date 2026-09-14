"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowLeft, ShieldAlert, KeyRound, CheckCircle2, Loader2 } from "lucide-react";
import { openGoogleOAuthPopup } from "@/components/auth/google-oauth-popup";

export function RootsLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage("Silakan masukkan username dan kata sandi.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/roots/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Gagal masuk. Periksa username dan kata sandi.");
        setIsLoading(false);
        return;
      }

      // Berhasil login
      router.refresh();
      window.location.href = "/roots";
    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage("Terjadi kesalahan koneksi. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const result = await openGoogleOAuthPopup("/roots");
    if (result.success) {
      router.replace("/roots");
      router.refresh();
      return;
    }
    setErrorMessage(result.error === "popup_blocked" ? "Popup diblokir browser. Izinkan popup lalu coba kembali." : "Login Google dibatalkan atau belum berhasil.");
    setIsLoading(false);
  };

  return (
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
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
        Masuk menggunakan kredensial administrator Roots atau akun Google yang terdaftar.
      </p>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-left text-xs text-rose-300">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Login Kredensial */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            autoComplete="username"
            placeholder="Masukkan username admin"
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Kata Sandi
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-4 pr-10 text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Memverifikasi...</span>
            </>
          ) : (
            <span>Masuk ke Roots</span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-slate-900 px-3 font-bold text-slate-500">Atau</span>
        </div>
      </div>

      {/* Google Login Option */}
      <div>
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:cursor-wait disabled:opacity-60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{isLoading ? "Menghubungkan..." : "Masuk dengan Google Admin"}</span>
        </button>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-300 transition"
        >
          <ArrowLeft size={13} />
          <span>Kembali ke Beranda Utama</span>
        </Link>
      </div>
    </div>
  );
}

export function RootsChangePasswordForm({ username }: { username?: string | null }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMessage("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage("Kata sandi baru tidak boleh sama dengan kata sandi lama.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/roots/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Gagal mengubah kata sandi.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.refresh();
        window.location.href = "/roots";
      }, 1200);
    } catch (err) {
      console.error("Change password error:", err);
      setErrorMessage("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-amber-500/30 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-xl text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
        <KeyRound size={28} />
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-400 mb-2">
        <span>Penggantian Kata Sandi Wajib</span>
      </div>

      <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
        Perbarui Kata Sandi
      </h1>
      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
        {username ? (
          <>
            Akun <span className="font-mono text-amber-300 font-semibold">{username}</span> wajib mengganti kata sandi awal sebelum dapat mengakses dashboard Roots.
          </>
        ) : (
          "Anda wajib mengganti kata sandi awal sebelum dapat mengakses dashboard Roots."
        )}
      </p>

      {errorMessage && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-left text-xs text-rose-300">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSuccess && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-left text-xs text-emerald-300">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          <span>Kata sandi berhasil diperbarui! Mengalihkan ke dashboard...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-left">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Kata Sandi Saat Ini
          </label>
          <input
            type={showPass ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isLoading || isSuccess}
            placeholder="Masukkan kata sandi awal/sementara"
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Kata Sandi Baru (min 8 karakter)
          </label>
          <input
            type={showPass ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isLoading || isSuccess}
            placeholder="Masukkan kata sandi baru yang kuat"
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Konfirmasi Kata Sandi Baru
          </label>
          <input
            type={showPass ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading || isSuccess}
            placeholder="Ulangi kata sandi baru"
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
            required
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-200"
          >
            {showPass ? "Sembunyikan karakter" : "Tampilkan karakter"}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading || isSuccess}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Simpan Kata Sandi &amp; Buka Dashboard</span>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.refresh();
            window.location.href = "/roots";
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-300 transition cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>Batalkan dan Keluar</span>
        </button>
      </div>
    </div>
  );
}
