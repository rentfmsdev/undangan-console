"use client";

import React, { useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  LoaderCircle,
  ShieldAlert,
} from "lucide-react";

export type RootsDialogVariant = "warning" | "danger" | "success" | "info";

export type RootsDialogState = {
  isOpen: boolean;
  type?: "confirm" | "alert";
  title: string;
  message: string;
  note?: string;
  variant?: RootsDialogVariant;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm?: () => void | Promise<void>;
  onClose?: () => void;
};

interface RootsConfirmDialogProps {
  dialog: RootsDialogState | null;
  onClose: () => void;
  onConfirm?: () => void;
}

export function RootsConfirmDialog({
  dialog,
  onClose,
  onConfirm,
}: RootsConfirmDialogProps) {
  if (!dialog || !dialog.isOpen) return null;

  const isAlert = dialog.type === "alert";
  const variant = dialog.variant || (isAlert ? "info" : "warning");

  // Keyboard accessibility (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !dialog.isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog.isLoading, onClose]);

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertCircle className="h-6 w-6 text-rose-400" />;
      case "warning":
        return <ShieldAlert className="h-6 w-6 text-amber-400" />;
      case "success":
        return <CheckCircle2 className="h-6 w-6 text-emerald-400" />;
      case "info":
      default:
        return <Info className="h-6 w-6 text-sky-400" />;
    }
  };

  const getBadgeColor = () => {
    switch (variant) {
      case "danger":
        return "border-rose-500/30 bg-rose-500/10 text-rose-300";
      case "warning":
        return "border-amber-500/30 bg-amber-500/10 text-amber-300";
      case "success":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
      case "info":
      default:
        return "border-sky-500/30 bg-sky-500/10 text-sky-300";
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case "danger":
        return "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40";
      case "warning":
        return "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-900/40";
      case "success":
      case "info":
      default:
        return "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-900/40";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !dialog.isLoading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-black/80 backdrop-blur-xl transition-all animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        {!dialog.isLoading && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Tutup dialog"
          >
            <X size={18} />
          </button>
        )}

        <div className="flex items-start gap-4">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${getBadgeColor()}`}>
            {getIcon()}
          </div>

          <div className="flex-1 pr-4">
            <h3 className="text-base font-bold text-white tracking-tight">
              {dialog.title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              {dialog.message}
            </p>

            {dialog.note && (
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-[11px] leading-relaxed text-slate-400">
                <span className="font-semibold text-slate-300">Catatan:</span> {dialog.note}
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-800/80 pt-4">
          {!isAlert && (
            <button
              type="button"
              disabled={dialog.isLoading}
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50"
            >
              {dialog.cancelText || "Batal"}
            </button>
          )}

          <button
            type="button"
            disabled={dialog.isLoading}
            onClick={() => {
              if (isAlert) {
                onClose();
              } else if (onConfirm) {
                onConfirm();
              } else if (dialog.onConfirm) {
                void dialog.onConfirm();
              }
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-lg disabled:cursor-wait disabled:opacity-60 ${
              isAlert
                ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
                : getConfirmButtonClass()
            }`}
          >
            {dialog.isLoading && (
              <LoaderCircle size={14} className="animate-spin" />
            )}
            <span>
              {isAlert
                ? dialog.confirmText || "Mengerti"
                : dialog.confirmText || "Lanjutkan"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
