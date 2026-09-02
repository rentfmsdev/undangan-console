"use client";

import { Check, CloudUpload, LoaderCircle, RefreshCw, TriangleAlert } from "lucide-react";
import type { AutoSaveStatus } from "../hooks/useAutoSave";

type Props = {
  status: AutoSaveStatus;
  isCloud?: boolean;
  onRetry?: () => void;
  className?: string;
};

export function AutoSaveStatusBadge({
  status,
  isCloud = true,
  onRetry,
  className = "",
}: Props) {
  if (status === "saving") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 ${className}`}>
        <LoaderCircle size={11} className="animate-spin" />
        <span>Menyimpan...</span>
      </span>
    );
  }

  if (status === "unsaved") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-600 ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span>Menunggu jeda...</span>
      </span>
    );
  }

  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        title="Gagal menyimpan perubahan. Klik untuk mencoba kembali."
        className={`inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition active:scale-95 ${className}`}
      >
        <TriangleAlert size={11} />
        <span>Gagal simpan (Klik retry)</span>
      </button>
    );
  }

  // Saved / Idle
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${isCloud ? "text-emerald-600" : "text-slate-500"} ${className}`}>
      {isCloud ? <Check size={11} /> : <CloudUpload size={11} />}
      <span>{isCloud ? "Tersimpan di cloud" : "Tersimpan lokal"}</span>
    </span>
  );
}
