"use client";

import { Check, CloudUpload, LoaderCircle, TriangleAlert } from "lucide-react";
import type { AutoSaveStatus } from "../hooks/useAutoSave";
import { StatusBadge } from "@/components/ui/StatusBadge";

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
      <StatusBadge tone="info" icon={<LoaderCircle size={12} className="animate-spin" />} className={className}>Menyimpan</StatusBadge>
    );
  }

  if (status === "unsaved") {
    return (
      <StatusBadge tone="warning" icon={<span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />} className={className}>Menunggu simpan</StatusBadge>
    );
  }

  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        title="Gagal menyimpan perubahan. Klik untuk mencoba kembali."
        className={`ui-interactive inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 ${className}`}
      >
        <TriangleAlert size={12} />
        <span>Gagal menyimpan · coba lagi</span>
      </button>
    );
  }

  // Saved / Idle
  return (
    <StatusBadge tone={isCloud ? "success" : "neutral"} icon={isCloud ? <Check size={12} /> : <CloudUpload size={12} />} className={className}>{isCloud ? "Tersimpan" : "Tersimpan lokal"}</StatusBadge>
  );
}
