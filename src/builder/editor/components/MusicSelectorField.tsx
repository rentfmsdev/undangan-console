"use client";

import { FolderOpen, Music2, Pause, Play, Sparkles, Volume1, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  stockMusicLibrary,
  normalizeMusicCategory,
  getStockMusicByUrl,
  type StockMusicTrack,
} from "@/config/stock-music";
import { EditorSelect, type SelectOption } from "./EditorSelect";

type Props = {
  musicUrl: string;
  volume?: number; // 0 to 1, default 0.60
  disabled?: boolean;
  category?: string; // template category: "wedding", "birthday", "khitanan", "aqiqah", etc.
  onChange: (url: string) => void;
  onVolumeChange?: (volume: number) => void;
  onOpenLibrary: () => void;
};

export function MusicSelectorField({
  musicUrl,
  volume = 0.6,
  disabled = false,
  category = "wedding",
  onChange,
  onVolumeChange,
  onOpenLibrary,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio preview when musicUrl changes or component unmounts
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, [musicUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const normCategory = normalizeMusicCategory(category);
  const categoryLabels: Record<string, string> = {
    wedding: "Pernikahan",
    birthday: "Ulang Tahun",
    khitanan: "Khitanan",
    aqiqah: "Aqiqah",
  };
  const currentCategoryLabel = categoryLabels[normCategory] || normCategory;

  const selectedTrack = useMemo(() => {
    return getStockMusicByUrl(musicUrl);
  }, [musicUrl]);

  const selectOptions: SelectOption[] = useMemo(() => {
    // 1. Tracks matching this category
    const recommended = stockMusicLibrary.filter((track) => {
      if (track.category === normCategory) return true;
      if (track.categories?.includes(normCategory)) return true;
      return false;
    });

    // 2. Tracks for other categories
    const others = stockMusicLibrary.filter((track) => !recommended.some((r) => r.id === track.id));

    const list: SelectOption[] = [];

    // Recommended section for current template category
    recommended.forEach((track) => {
      list.push({
        value: track.url,
        label: `⭐ ${track.title} — ${track.artist}`,
        subtitle: `${track.genre || track.categoryLabel || track.category} · ${track.duration}`,
      });
    });

    // Other categories section
    others.forEach((track) => {
      list.push({
        value: track.url,
        label: `${track.title} — ${track.artist}`,
        subtitle: `${track.categoryLabel || track.category}${track.genre ? ` · ${track.genre}` : ""} · ${track.duration}`,
      });
    });

    list.push({
      value: "",
      label: "Tanpa musik",
      subtitle: "Undangan hening tanpa pengiring",
    });

    if (musicUrl && !stockMusicLibrary.some((t) => t.url === musicUrl)) {
      list.push({
        value: musicUrl,
        label: musicUrl.startsWith("/uploads/") ? "Musik upload saya" : "Musik pilihan kustom",
        subtitle: "File audio eksternal",
      });
    }

    return list;
  }, [musicUrl, normCategory, currentCategoryLabel]);

  function togglePlayPreview() {
    if (!musicUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.src = musicUrl;
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.currentTime = 0;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }

  const hasMusic = Boolean(musicUrl);

  return (
    <div className="min-w-0 space-y-2.5">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Label and Status */}
      <div className="flex min-w-0 items-center justify-between gap-2">
        <label className="flex min-w-0 items-center gap-2 text-xs font-bold text-slate-700">
          <Music2 size={14} className="text-emerald-600" />
          <span className="truncate">Musik undangan</span>
        </label>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
            <Sparkles size={10} className="text-amber-500" />
            <span>{currentCategoryLabel}</span>
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
              hasMusic ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {hasMusic ? (
              <>
                <Volume2 size={10} />
                <span>Aktif</span>
              </>
            ) : (
              <>
                <VolumeX size={10} />
                <span>Mati</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Custom Reusable Select Dropdown with Integrated Play/Pause Button */}
      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <EditorSelect
            value={musicUrl}
            options={selectOptions}
            disabled={disabled}
            placeholder="Pilih musik undangan..."
            onChange={onChange}
          />
        </div>

        {/* Mini Preview Play/Pause Button */}
        <button
          type="button"
          disabled={!hasMusic || disabled}
          onClick={togglePlayPreview}
          title={!hasMusic ? "Tidak ada musik dipilih" : isPlaying ? "Jeda lagu" : "Putar tes lagu"}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
            isPlaying
              ? "border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-600/30 animate-pulse"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          }`}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>
      </div>

      {/* Track Info Badge when playing or selected */}
      {selectedTrack && (
        <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-slate-100/80 border border-slate-200/80 px-2.5 py-1.5 text-[10px] text-slate-600">
          <span className="min-w-0 truncate">
            Genre: <strong className="text-slate-800">{selectedTrack.genre || selectedTrack.categoryLabel}</strong>
          </span>
          <span className="shrink-0 text-slate-400 font-mono">{selectedTrack.duration}</span>
        </div>
      )}

      {/* Volume Adjustment Slider */}
      {hasMusic && (
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/90 p-3">
          <div className="mb-1.5 flex min-w-0 items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold text-slate-700">
              {volume === 0 ? (
                <VolumeX size={13} className="text-slate-400" />
              ) : volume < 0.4 ? (
                <Volume1 size={13} className="text-emerald-600" />
              ) : (
                <Volume2 size={13} className="text-emerald-600" />
              )}
              <span className="truncate">Volume Musik</span>
            </span>
            <span className="rounded-md bg-white border border-slate-200/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-800">
              {Math.round((volume ?? 0.6) * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              disabled={disabled}
              value={Math.round((volume ?? 0.6) * 100)}
              onChange={(e) => {
                const nextVol = Number(e.target.value) / 100;
                onVolumeChange?.(nextVol);
                if (audioRef.current) audioRef.current.volume = nextVol;
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600 transition"
            />
          </div>
        </div>
      )}

      {/* Button to Open Asset Manager Modal */}
      <button
        type="button"
        disabled={disabled}
        onClick={onOpenLibrary}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 hover:border-emerald-300 active:scale-95 disabled:cursor-wait disabled:opacity-55"
      >
        <FolderOpen size={15} />
        <span>Pilih dari Asset Saya</span>
      </button>
    </div>
  );
}
