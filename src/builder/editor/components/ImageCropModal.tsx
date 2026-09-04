"use client";

import {
  Check,
  Crop,
  FlipHorizontal,
  FlipVertical,
  LoaderCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CropProps = {
  open: boolean;
  imageUrl: string;
  imageName?: string;
  draftId?: string | null;
  onClose: () => void;
  onCropComplete: (newAsset: { id: string; url: string; name: string }) => void;
};

type AspectRatioOption = {
  label: string;
  value: number | null; // width / height, null for free/original
};

const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: "Bebas", value: null },
  { label: "1:1 Persegi", value: 1 },
  { label: "4:5 Portrait", value: 4 / 5 },
  { label: "3:4 Galeri", value: 3 / 4 },
  { label: "16:9 Banner", value: 16 / 9 },
];

export function ImageCropModal({
  open,
  imageUrl,
  imageName = "Foto",
  draftId,
  onClose,
  onCropComplete,
}: CropProps) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load Image when open or imageUrl changes
  useEffect(() => {
    if (!open || !imageUrl) return;

    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setOffset({ x: 0, y: 0 });
    setError("");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageElementRef.current = img;
      drawCanvas();
    };
    img.onerror = () => {
      setError("Gagal memuat gambar untuk di-edit.");
    };
    img.src = imageUrl;
  }, [open, imageUrl]);

  // Redraw when parameters change
  useEffect(() => {
    if (imageElementRef.current) {
      drawCanvas();
    }
  }, [aspectRatio, zoom, rotation, flipH, flipV, offset]);

  function drawCanvas() {
    const canvas = canvasRef.current;
    const img = imageElementRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Viewport box dimensions
    const boxWidth = 560;
    const boxHeight = 400;

    let targetCropW = boxWidth;
    let targetCropH = boxHeight;

    if (aspectRatio !== null) {
      if (boxWidth / boxHeight > aspectRatio) {
        targetCropH = boxHeight;
        targetCropW = boxHeight * aspectRatio;
      } else {
        targetCropW = boxWidth;
        targetCropH = boxWidth / aspectRatio;
      }
    }

    canvas.width = targetCropW;
    canvas.height = targetCropH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Center coordinates
    ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);

    // Calculate image fitting
    const scaleToFit = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const renderW = img.naturalWidth * scaleToFit;
    const renderH = img.naturalHeight * scaleToFit;

    ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
    ctx.restore();
  }

  function getCanvasScale() {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 1, y: 1 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.width ? canvas.width / rect.width : 1,
      y: rect.height ? canvas.height / rect.height : 1,
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    const scale = getCanvasScale();
    setIsDragging(true);
    setDragStart({ x: e.clientX * scale.x - offset.x, y: e.clientY * scale.y - offset.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    e.preventDefault();
    const scale = getCanvasScale();
    setOffset({
      x: e.clientX * scale.x - dragStart.x,
      y: e.clientY * scale.y - dragStart.y,
    });
  }

  function handlePointerUp(e?: React.PointerEvent<HTMLDivElement>) {
    setIsDragging(false);
    if (e?.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function handleRotate(deg: number) {
    setRotation((prev) => (prev + deg + 360) % 360);
  }

  function handleReset() {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setOffset({ x: 0, y: 0 });
    setAspectRatio(null);
  }

  async function handleSaveCrop() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);
    setError("");

    try {
      // Export high-quality blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      );

      if (!blob) throw new Error("Gagal mengolah hasil crop gambar.");

      const file = new File(
        [blob],
        `crop_${imageName.replace(/\.[^/.]+$/, "")}_${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      const formData = new FormData();
      formData.append("file", file);
      if (draftId) formData.append("draftId", draftId);

      const res = await fetch(draftId ? `/api/drafts/${draftId}/assets` : "/api/assets", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan hasil crop ke asset.");

      onCropComplete({
        id: data.id,
        url: data.url,
        name: data.name ?? file.name,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan crop.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-slate-950/75 p-0 backdrop-blur-md animate-in fade-in duration-200 sm:grid sm:place-items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image Editor & Crop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/40 bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-3xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <Crop size={17} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Image Editor & Crop</h2>
              <p className="text-[11px] text-slate-500">Sesuaikan potongan, perbesar, atau putar foto Anda.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
          >
            <X size={16} />
          </button>
        </header>

        {/* Canvas Stage Area */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative flex min-h-[220px] flex-1 touch-none items-center justify-center overflow-hidden bg-slate-900 p-3 select-none cursor-grab active:cursor-grabbing sm:min-h-[380px] sm:p-6"
        >
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Render Canvas */}
          <canvas
            ref={canvasRef}
            className="relative z-10 max-h-[250px] max-w-full rounded-xl border-2 border-emerald-500/80 bg-slate-950/60 shadow-2xl transition-transform sm:max-h-[360px]"
          />

          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 rounded-full bg-slate-900/85 px-2.5 py-1 text-[9px] font-semibold text-slate-300 backdrop-blur sm:bottom-3 sm:left-3 sm:px-3 sm:text-[10px]">
            <span>Geser foto untuk memosisikan</span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="console-scrollbar max-h-[44dvh] overflow-y-auto space-y-4 border-t border-slate-100 bg-white p-4 sm:max-h-none sm:p-5">
          {/* Aspect Ratio Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700">Rasio Potongan:</span>
            <div className="flex flex-wrap gap-1.5">
              {ASPECT_RATIOS.map((preset) => {
                const isActive = aspectRatio === preset.value;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAspectRatio(preset.value)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zoom, Rotate, and Flip controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2 border-t border-slate-100">
            {/* Zoom Slider */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-700 min-w-14">Zoom:</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.2).toFixed(1))))}
                className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <ZoomOut size={14} />
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, Number((z + 0.2).toFixed(1))))}
                className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <ZoomIn size={14} />
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-500 w-10 text-right">
                {zoom.toFixed(1)}x
              </span>
            </div>

            {/* Transform buttons */}
            <div className="flex flex-wrap items-center justify-start gap-1.5 sm:justify-end">
              <button
                type="button"
                onClick={() => handleRotate(-90)}
                title="Putar ke Kiri 90°"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <RotateCcw size={13} /> -90°
              </button>
              <button
                type="button"
                onClick={() => handleRotate(90)}
                title="Putar ke Kanan 90°"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <RotateCw size={13} /> +90°
              </button>
              <button
                type="button"
                onClick={() => setFlipH((f) => !f)}
                title="Flip Horizontal"
                className={`grid h-8 w-8 place-items-center rounded-xl border transition ${
                  flipH ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <FlipHorizontal size={14} />
              </button>
              <button
                type="button"
                onClick={() => setFlipV((f) => !f)}
                title="Flip Vertikal"
                className={`grid h-8 w-8 place-items-center rounded-xl border transition ${
                  flipV ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <FlipVertical size={14} />
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="Reset Penyesuaian"
                className="ml-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:border-rose-200 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-700">
              {error}
            </p>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveCrop}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <LoaderCircle className="animate-spin" size={15} />
                  <span>Menyimpan Crop...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Simpan & Gunakan Foto</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
