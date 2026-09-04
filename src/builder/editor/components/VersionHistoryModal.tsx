"use client";

import { Check, History, LoaderCircle, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { SharedDraftState } from "@/modules/collaboration/domain/crdt-mapper";

type VersionItem = {
  id: string;
  revision: number;
  createdAt: string;
};

export function VersionHistoryModal({
  open,
  draftId,
  disabled = false,
  onClose,
  onRestore,
}: {
  open: boolean;
  draftId: string | null;
  disabled?: boolean;
  onClose: () => void;
  onRestore: (state: SharedDraftState) => void;
}) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !draftId) return;
    let active = true;
    setLoading(true);
    setError("");
    fetch(`/api/drafts/${draftId}/history`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Gagal memuat riwayat versi.");
        if (active) setVersions(payload.versions ?? []);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Gagal memuat riwayat versi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, draftId]);

  if (!open) return null;

  const restore = async (version: VersionItem) => {
    if (!draftId) return;
    setRestoringId(version.id);
    setError("");
    try {
      const response = await fetch(`/api/drafts/${draftId}/history?snapshotId=${encodeURIComponent(version.id)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.state) throw new Error(payload.error || "Versi tidak dapat dipulihkan.");
      onRestore(payload.state as SharedDraftState);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Versi tidak dapat dipulihkan.");
    } finally {
      setRestoringId(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm animate-in fade-in duration-150" role="dialog" aria-modal="true" aria-labelledby="version-history-title">
      <section className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white"><History size={17} /></span>
            <div>
              <h2 id="version-history-title" className="text-sm font-semibold text-slate-900">Riwayat versi</h2>
              <p className="mt-0.5 text-xs text-slate-500">Versi otomatis dari perubahan kolaboratif.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup riwayat versi"><X size={16} /></button>
        </header>

        <div className="console-scrollbar min-h-32 flex-1 overflow-y-auto p-3">
          {loading ? <div className="grid min-h-28 place-items-center text-xs text-slate-500"><LoaderCircle size={18} className="mb-2 animate-spin text-slate-700" />Memuat riwayat…</div> : error ? <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p> : versions.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center"><History size={18} className="mx-auto text-slate-400" /><p className="mt-2 text-xs font-semibold text-slate-700">Belum ada versi tersimpan</p><p className="mt-1 text-xs text-slate-500">Versi dibuat otomatis setelah perubahan tersinkron ke server.</p></div> : <div className="space-y-2">{versions.map((version, index) => {
            const isLatest = index === 0;
            const isConfirming = confirmId === version.id;
            return <article key={version.id} className="rounded-xl border border-slate-200 p-3 transition hover:border-slate-300"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-800">Versi {version.revision}{isLatest ? " · Terbaru" : ""}</p><time className="mt-0.5 block text-xs text-slate-500">{new Date(version.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</time></div>{isConfirming ? <div className="flex items-center gap-1"><button type="button" disabled={disabled || restoringId === version.id} onClick={() => void restore(version)} className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">{restoringId === version.id ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />} Pulihkan</button><button type="button" onClick={() => setConfirmId(null)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">Batal</button></div> : <button type="button" disabled={disabled || isLatest} onClick={() => setConfirmId(version.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"><RotateCcw size={13} /> Pulihkan</button>}</div></article>;
          })}</div>}
        </div>
        {disabled && <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800">Tunggu koneksi kolaborasi aktif sebelum memulihkan versi.</p>}
      </section>
    </div>
  );
}
