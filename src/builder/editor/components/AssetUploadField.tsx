"use client";

import { FolderOpen, ImagePlus, X } from "lucide-react";
import Image from "next/image";

type Props = {
  title: string;
  urls: string[];
  hint: string;
  onOpenLibrary: () => void;
  onRemove: (index: number) => void;
};

export function AssetUploadField({ title, urls, hint, onOpenLibrary, onRemove }: Props) {
  const visibleUrls = urls.filter(Boolean);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-slate-300">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-800">{title}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>
        </div>
      </div>

      {visibleUrls.length > 0 ? (
        <div className={`mb-3 grid gap-2.5 ${visibleUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {visibleUrls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-[16/9] overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              <Image
                src={url}
                alt={`${title} ${index + 1}`}
                fill
                unoptimized
                sizes="320px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Hapus ${title} ${index + 1}`}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-slate-950/75 text-white shadow-lg backdrop-blur transition hover:bg-rose-600 active:scale-95"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3 grid min-h-24 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-slate-400">
          <div>
            <ImagePlus className="mx-auto mb-1 text-slate-300" size={24} />
            <span className="text-[11px] font-medium text-slate-500">Belum ada gambar terpilih</span>
          </div>
        </div>
      )}

      {/* Centralized Asset Selector Button */}
      <button
        type="button"
        onClick={onOpenLibrary}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 hover:border-emerald-300 active:scale-95"
      >
        <FolderOpen size={15} />
        <span>{visibleUrls.length ? "Ganti dari Asset Saya" : "Pilih dari Asset Saya"}</span>
      </button>
    </section>
  );
}
