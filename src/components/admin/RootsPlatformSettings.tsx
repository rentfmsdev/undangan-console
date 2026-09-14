"use client";

import { AlertCircle, BarChart3, CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";

export function RootsPlatformSettings({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [metaPixelId, setMetaPixelId] = useState("");
  const [isLoading, setIsLoading] = useState(isSuperAdmin);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetch("/api/roots/platform-settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setMetaPixelId(typeof payload.metaPixelId === "string" ? payload.metaPixelId : ""))
      .catch(() => setMessage({ type: "error", text: "Pengaturan global belum dapat dimuat." }))
      .finally(() => setIsLoading(false));
  }, [isSuperAdmin]);

  if (!isSuperAdmin) return null;

  const save = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/roots/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metaPixelId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Pengaturan belum dapat disimpan.");
      setMetaPixelId(payload.metaPixelId || "");
      setMessage({ type: "success", text: payload.metaPixelId ? "Meta Pixel aktif dan tersimpan." : "Meta Pixel dinonaktifkan." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Pengaturan belum dapat disimpan." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-400"><BarChart3 size={19} /></div>
          <div>
            <h2 className="text-sm font-extrabold text-white">Integrasi Analytics</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">Simpan Meta Pixel ID untuk seluruh undangan. Kosongkan lalu simpan untuk menonaktifkan tracking tanpa deploy ulang.</p>
          </div>
        </div>
        {message && <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${message.type === "success" ? "text-emerald-400" : "text-rose-400"}`}>{message.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}{message.text}</span>}
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Meta Pixel ID</span>
          <input
            inputMode="numeric"
            value={metaPixelId}
            disabled={isLoading || isSaving}
            onChange={(event) => setMetaPixelId(event.target.value.replace(/\D/g, ""))}
            placeholder="Contoh: 123456789012345"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:opacity-60"
          />
        </label>
        <button type="button" onClick={save} disabled={isLoading || isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60">
          {isSaving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
          {isSaving ? "Menyimpan..." : "Simpan Pixel"}
        </button>
      </div>
    </section>
  );
}
