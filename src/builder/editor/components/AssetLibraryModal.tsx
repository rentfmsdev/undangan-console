"use client";

import {
  Check,
  Crop,
  Disc3,
  Headphones,
  Image as ImageIcon,
  LoaderCircle,
  Music2,
  Pause,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  Volume2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { stockMusicLibrary, type StockMusicTrack } from "@/config/stock-music";
import { ImageCropModal } from "./ImageCropModal";

export type UserAsset = {
  id: string;
  invitationId?: string;
  kind: "image" | "audio";
  url: string;
  name: string | null;
  createdAt: string;
};

type Props = {
  open: boolean;
  kind?: "image" | "audio";
  mode?: "select" | "manage"; // default "select"
  draftId?: string | null;
  onClose: () => void;
  onSelect?: (asset: UserAsset) => void;
};

export function AssetLibraryModal({
  open,
  kind = "image",
  mode = "select",
  draftId,
  onClose,
  onSelect,
}: Props) {
  const [currentTab, setCurrentTab] = useState<"image" | "audio">(kind);
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [audioSourceTab, setAudioSourceTab] = useState<"stock" | "uploads">("stock");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Audio preview state
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Image Crop Editor state
  const [cropTarget, setCropTarget] = useState<UserAsset | null>(null);

  useEffect(() => {
    if (open) {
      setError("");
      setSuccessMsg("");
      setSearchQuery("");
      setAudioSourceTab("stock");
      setCurrentTab(kind);
      loadAssets(kind);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.currentTime = 0;
      }
      setPlayingAudioUrl(null);
      setCropTarget(null);
    }
  }, [open, kind]);

  async function loadAssets(tabKind: "image" | "audio") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/assets?kind=${tabKind}`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Gagal memuat asset.");
      setAssets(payload.assets ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat asset.");
    } finally {
      setLoading(false);
    }
  }

  function handleSwitchTab(nextTab: "image" | "audio") {
    setCurrentTab(nextTab);
    setSearchQuery("");
    setError("");
    setSuccessMsg("");
    loadAssets(nextTab);
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    setError("");
    setSuccessMsg("");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Type safety check
        if (currentTab === "audio" && !file.type.startsWith("audio/")) {
          throw new Error("Hanya file audio (MP3, M4A, OGG, WebM) yang diperbolehkan untuk musik.");
        }
        if (currentTab === "image" && !file.type.startsWith("image/")) {
          throw new Error("Hanya file gambar (JPG, PNG, WebP, AVIF) yang diperbolehkan untuk foto.");
        }

        const formData = new FormData();
        formData.append("file", file);
        if (draftId) formData.append("draftId", draftId);

        const res = await fetch(draftId ? `/api/drafts/${draftId}/assets` : "/api/assets", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah file.");
      }

      setSuccessMsg(`File ${currentTab === "image" ? "foto" : "musik"} berhasil diunggah ke Asset Saya!`);
      setTimeout(() => setSuccessMsg(""), 4000);
      if (currentTab === "audio") setAudioSourceTab("uploads");
      await loadAssets(currentTab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteAsset(e: React.MouseEvent, assetId: string) {
    e.stopPropagation();
    if (!confirm(`Hapus ${currentTab === "image" ? "foto" : "musik"} ini dari pustaka Anda?`)) return;

    setDeletingId(assetId);
    setError("");
    try {
      const res = await fetch(`/api/assets?id=${assetId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menghapus asset.");

      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      if (playingAudioUrl && assets.find((a) => a.id === assetId)?.url === playingAudioUrl) {
        audioPreviewRef.current?.pause();
        setPlayingAudioUrl(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus asset.");
    } finally {
      setDeletingId(null);
    }
  }

  function toggleAudioPreview(e: React.MouseEvent, url: string) {
    e.stopPropagation();
    if (playingAudioUrl === url) {
      audioPreviewRef.current?.pause();
      setPlayingAudioUrl(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = url;
        audioPreviewRef.current.currentTime = 0;
        audioPreviewRef.current.play().catch(() => {});
      }
      setPlayingAudioUrl(url);
    }
  }

  function handleSelectStockMusic(track: StockMusicTrack) {
    if (mode === "manage") return; // No selecting in manage mode
    onSelect?.({
      id: track.id,
      kind: "audio",
      url: track.url,
      name: `${track.title} — ${track.artist}`,
      createdAt: new Date().toISOString(),
    });
    onClose();
  }

  function handleSelectAsset(asset: UserAsset) {
    if (mode === "manage") return; // No selecting in manage mode
    onSelect?.(asset);
    onClose();
  }

  function handleCropComplete(newAsset: { id: string; url: string; name: string }) {
    const fullAsset: UserAsset = {
      id: newAsset.id,
      kind: "image",
      url: newAsset.url,
      name: newAsset.name,
      createdAt: new Date().toISOString(),
    };

    if (mode === "manage") {
      // In manage mode, just add to asset list and show feedback without closing
      setAssets((prev) => [fullAsset, ...prev]);
      setSuccessMsg("Hasil crop foto berhasil disimpan ke Asset Saya!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      // In select mode, choose and close
      onSelect?.(fullAsset);
      onClose();
    }
  }

  const filteredStockMusic = useMemo(() => {
    if (!searchQuery.trim()) return stockMusicLibrary;
    const q = searchQuery.toLowerCase();
    return stockMusicLibrary.filter(
      (m) => m.title.toLowerCase().includes(q) || m.artist.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const q = searchQuery.toLowerCase();
    return assets.filter((a) => (a.name ?? "").toLowerCase().includes(q));
  }, [assets, searchQuery]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Asset Manager"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <audio ref={audioPreviewRef} onEnded={() => setPlayingAudioUrl(null)} className="hidden" />

        <div className="flex max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl">
          {/* Modal Header */}
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                {currentTab === "image" ? <ImageIcon size={20} /> : <Music2 size={20} />}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Pustaka Saya
                </h2>
                <p className="text-[11px] text-slate-500">
                  {currentTab === "image" ? "Foto & gambar undangan" : "Musik pengiring undangan"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search input */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Cari nama ${currentTab === "image" ? "foto" : "lagu / genre"}...`}
                  className="w-52 rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>

              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Mode Switcher Tabs for "manage" mode */}
          {mode === "manage" && (
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-2.5">
              <div className="flex rounded-xl bg-slate-200/70 p-1">
                <button
                  type="button"
                  onClick={() => handleSwitchTab("image")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                    currentTab === "image"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ImageIcon size={14} />
                  <span>Foto & Gambar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchTab("audio")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                    currentTab === "audio"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Music2 size={14} />
                  <span>Musik Undangan</span>
                </button>
              </div>

              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full hidden sm:inline">
                Mode Kelola Pustaka (Hanya Edit / Pratinjau)
              </span>
            </div>
          )}

          {/* Sub-Header for Audio: Stock vs User Uploads */}
          {currentTab === "audio" && (
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-2.5">
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setAudioSourceTab("stock")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    audioSourceTab === "stock"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles size={13} className={audioSourceTab === "stock" ? "text-amber-500" : "text-slate-400"} />
                  <span>Musik Studio ({stockMusicLibrary.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudioSourceTab("uploads")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    audioSourceTab === "uploads"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Disc3 size={13} />
                  <span>Upload Saya ({assets.length})</span>
                </button>
              </div>

              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                {audioSourceTab === "stock"
                  ? "Bebas royalti & siap digunakan langsung"
                  : "Lagu MP3 pribadi Anda"}
              </span>
            </div>
          )}

          {/* Upload Dropzone (For Image, or for Audio when on uploads tab) */}
          {(currentTab === "image" || (currentTab === "audio" && audioSourceTab === "uploads")) && (
            <div className="border-b border-slate-100 bg-white px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-4 transition hover:bg-emerald-50 hover:border-emerald-400">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                    <UploadCloud size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">
                      Upload {currentTab === "image" ? "Foto / Gambar Baru" : "File Musik MP3 Baru"}
                    </p>
                    <p className="text-[11px] text-emerald-800/80">
                      {currentTab === "image"
                        ? "Format: JPG, PNG, WebP, AVIF (Maks. 8MB per file)"
                        : "Format: MP3, M4A, OGG, WebM (Maks. 15MB per file)"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:cursor-wait disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <LoaderCircle className="animate-spin" size={15} />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      <span>Upload {currentTab === "image" ? "Foto Baru" : "Musik Baru"}</span>
                    </>
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={currentTab === "image"}
                  accept={
                    currentTab === "image"
                      ? "image/jpeg,image/png,image/webp,image/avif"
                      : "audio/mpeg,audio/mp4,audio/ogg,audio/webm,audio/mp3"
                  }
                  disabled={uploading}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </div>

              {/* Alerts */}
              {error && (
                <div className="mt-2.5 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="mt-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-semibold text-emerald-800">
                  {successMsg}
                </div>
              )}
            </div>
          )}

          {/* Modal Body */}
          <div className="console-scrollbar min-h-[320px] flex-1 overflow-y-auto p-6 bg-slate-50/40">
            {currentTab === "audio" && audioSourceTab === "stock" ? (
              /* Built-in Stock Music Library */
              <div className="space-y-3">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {filteredStockMusic.map((track) => {
                    const isPlaying = playingAudioUrl === track.url;
                    return (
                      <div
                        key={track.id}
                        onClick={() => handleSelectStockMusic(track)}
                        className={`group relative flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition ${
                          mode === "select"
                            ? "cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-xs"
                            : ""
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => toggleAudioPreview(e, track.url)}
                            title={isPlaying ? "Jeda musik" : "Putar pratinjau lagu"}
                            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${
                              isPlaying
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 animate-pulse"
                                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            }`}
                          >
                            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-block truncate text-xs font-extrabold text-slate-800 group-hover:text-emerald-950">
                                {track.title}
                              </span>
                              <span className="shrink-0 rounded-md bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                                {track.category}
                              </span>
                            </div>
                            <p className="truncate text-[11px] text-slate-500 mt-0.5">{track.artist}</p>
                            <p className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                              <Volume2 size={11} className="text-emerald-600" />
                              <span>{track.duration} · {mode === "manage" ? "Klik tombol play untuk tes lagu" : "Klik untuk pilih"}</span>
                            </p>
                          </div>
                        </div>

                        {mode === "select" && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs opacity-0 group-hover:opacity-100 transition shrink-0 whitespace-nowrap">
                            <Check size={13} /> Pilih
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : loading ? (
              <div className="grid min-h-[260px] place-items-center">
                <div className="flex flex-col items-center gap-2">
                  <LoaderCircle className="animate-spin text-emerald-600" size={32} />
                  <span className="text-xs font-semibold text-slate-500">Memuat asset {currentTab === "image" ? "foto" : "musik"}...</span>
                </div>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                <div className="max-w-xs">
                  {currentTab === "image" ? (
                    <ImageIcon className="mx-auto mb-3 text-slate-300" size={36} />
                  ) : (
                    <Headphones className="mx-auto mb-3 text-slate-300" size={36} />
                  )}
                  <p className="text-sm font-bold text-slate-800">
                    {searchQuery
                      ? `Tidak ada ${currentTab === "image" ? "foto" : "musik"} yang cocok dengan "${searchQuery}"`
                      : `Belum ada ${currentTab === "image" ? "foto / gambar" : "file musik"}`}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Klik tombol &quot;Upload {currentTab === "image" ? "Foto" : "Musik"} Baru&quot; di atas untuk menambahkan.
                  </p>
                </div>
              </div>
            ) : currentTab === "image" ? (
              /* Image Grid */
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs transition hover:-translate-y-1 hover:border-emerald-500 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      <Image
                        src={asset.url}
                        alt={asset.name ?? "Asset foto"}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, 220px"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />

                      {/* Overlay action buttons */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-slate-950/45 opacity-0 transition group-hover:opacity-100 p-2.5">
                        {mode === "select" && (
                          <button
                            type="button"
                            onClick={() => handleSelectAsset(asset)}
                            className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
                          >
                            <Check size={13} />
                            <span className="whitespace-nowrap">Pilih Foto</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCropTarget(asset);
                          }}
                          className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-white/95 backdrop-blur px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-white active:scale-95"
                        >
                          <Crop size={13} className="text-emerald-600" />
                          <span className="whitespace-nowrap">Edit / Crop</span>
                        </button>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        disabled={deletingId === asset.id}
                        onClick={(e) => handleDeleteAsset(e, asset.id)}
                        title="Hapus foto"
                        className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-slate-950/70 text-white shadow-md opacity-0 group-hover:opacity-100 transition hover:bg-rose-600 active:scale-95 disabled:opacity-50"
                      >
                        {deletingId === asset.id ? (
                          <LoaderCircle className="animate-spin" size={12} />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>

                    <div className="p-2.5">
                      <p className="truncate text-xs font-bold text-slate-800">{asset.name ?? "Foto"}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {new Date(asset.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Audio List */
              <div className="grid gap-2.5 sm:grid-cols-2">
                {filteredAssets.map((asset) => {
                  const isPlaying = playingAudioUrl === asset.url;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        if (mode === "select") handleSelectAsset(asset);
                      }}
                      className={`group relative flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs transition ${
                        mode === "select"
                          ? "cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-xs"
                          : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => toggleAudioPreview(e, asset.url)}
                          title={isPlaying ? "Jeda musik" : "Putar pratinjau musik"}
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
                            isPlaying
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          }`}
                        >
                          {isPlaying ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
                        </button>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-800 group-hover:text-emerald-950">
                            {asset.name ?? "Musik Undangan"}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Volume2 size={11} className="text-emerald-600" />
                            <span>{mode === "manage" ? "Klik tombol play untuk tes lagu" : "Klik untuk memilih musik ini"}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {mode === "select" && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100/70 px-2.5 py-1 text-xs font-bold text-emerald-800 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            <Check size={12} /> Pilih
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={deletingId === asset.id}
                          onClick={(e) => handleDeleteAsset(e, asset.id)}
                          title="Hapus musik"
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
                        >
                          {deletingId === asset.id ? (
                            <LoaderCircle className="animate-spin" size={13} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Crop & Editor Modal */}
      {cropTarget && (
        <ImageCropModal
          open={Boolean(cropTarget)}
          imageUrl={cropTarget.url}
          imageName={cropTarget.name ?? "Foto"}
          draftId={draftId}
          onClose={() => setCropTarget(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
