"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Copy, Pipette, RotateCcw, X } from "lucide-react";

type Props = {
  label: string;
  value?: string;
  fallbackValue: string;
  disabled?: boolean;
  compact?: boolean;
  placement?: "auto" | "top" | "bottom";
  onChange: (color: string) => void;
  onReset?: () => void;
};

const PRESET_SWATCHES = [
  { name: "Royal Gold", hex: "#D4AF37" },
  { name: "Champagne", hex: "#E5C158" },
  { name: "Rose Gold", hex: "#B76E79" },
  { name: "Maroon", hex: "#5B232D" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Emerald", hex: "#059669" },
  { name: "Sage Green", hex: "#8A9A86" },
  { name: "Midnight Lilac", hex: "#5B3F88" },
  { name: "Lavender", hex: "#7C3AED" },
  { name: "Deep Navy", hex: "#1E3A8A" },
  { name: "Terracotta", hex: "#C85A32" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Soft Ivory", hex: "#FDFBF7" },
  { name: "Slate Dark", hex: "#1E293B" },
];

export function FigmaColorPicker({
  label,
  value,
  fallbackValue,
  disabled = false,
  compact = false,
  placement = "auto",
  onChange,
  onReset,
}: Props) {
  const currentColor = value || fallbackValue;
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(placement === "top");
  const [hexInput, setHexInput] = useState(currentColor.toUpperCase());
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      if (placement === "top") {
        setOpenUpward(true);
      } else if (placement === "bottom") {
        setOpenUpward(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 320 || rect.top > window.innerHeight * 0.45);
      }
    } else if (placement === "top") {
      setOpenUpward(true);
    }
    setIsOpen((prev) => !prev);
  };

  // Sync internal hex text when external value changes
  useEffect(() => {
    setHexInput(currentColor.toUpperCase());
  }, [currentColor]);

  // Click outside listener to close popover
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleHexInputChange = (text: string) => {
    let clean = text.trim();
    if (!clean.startsWith("#")) clean = `#${clean}`;
    setHexInput(clean.toUpperCase());

    // Validate 6-digit hex
    if (/^#[0-9A-F]{6}$/i.test(clean) || /^#[0-9A-F]{3}$/i.test(clean)) {
      onChange(clean);
    }
  };

  const handleCopyHex = async () => {
    try {
      await navigator.clipboard.writeText(currentColor);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const handleEyeDropper = async () => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        // @ts-expect-error - EyeDropper API is standard in modern Chromium
        const dropper = new window.EyeDropper();
        const result = await dropper.open();
        if (result?.sRGBHex) {
          onChange(result.sRGBHex);
        }
      } catch {
        // user canceled eyedropper
      }
    }
  };

  const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;

  return (
    <div ref={containerRef} className={`relative ${isOpen ? "z-50" : "z-auto"}`}>
      {compact ? (
        <button
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          className="flex min-w-0 w-full items-center justify-between gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300 transition"
          style={{ fontSize: "11px" }}
          title={`Pilih ${label}`}
        >
          <span className="truncate">{label}</span>
          <span
            className="h-4 w-4 rounded-full border border-black/20 shadow-2xs shrink-0"
            style={{ backgroundColor: currentColor }}
          />
        </button>
      ) : (
        /* Trigger Row (Figma Property Style) */
        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 shadow-2xs">
          <span className="flex items-center gap-2 truncate pr-2">
            <span className="truncate">{label}</span>
            {onReset && value && value.toLowerCase() !== fallbackValue.toLowerCase() && (
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onReset();
                }}
                title="Reset ke warna tema bawaan"
                className="text-[9px] font-bold text-emerald-700 hover:underline"
              >
                Reset
              </button>
            )}
          </span>

          <button
            type="button"
            disabled={disabled}
            onClick={handleToggle}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-mono font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition active:scale-95 disabled:opacity-50"
          >
            {/* Swatch circle with checkered border */}
            <span
              className="h-4 w-4 rounded-full border border-black/15 shadow-2xs shrink-0"
              style={{ backgroundColor: currentColor }}
            />
            <span className="tracking-wider">{currentColor.toUpperCase()}</span>
          </button>
        </div>
      )}

      {/* Figma-Style Popover Dialog */}
      {isOpen && (
        <div
          className={`absolute right-0 z-[9999] w-64 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_20px_50px_rgba(15,23,42,0.22)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${
            openUpward ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
              Color Picker
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>

          {/* Live Preview Bar & Native Palette Trigger */}
          <div className="mb-3 flex items-center gap-2">
            <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-black/15 shadow-inner transition hover:scale-105 active:scale-95">
              <span
                className="absolute inset-0 block"
                style={{ backgroundColor: currentColor }}
              />
              <input
                type="color"
                value={currentColor}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
                title="Pilih warna bebas"
              />
            </label>

            {/* Editable Hex Input */}
            <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition">
              <span className="text-xs font-mono font-bold text-slate-400 mr-1">#</span>
              <input
                type="text"
                maxLength={7}
                value={hexInput.replace("#", "")}
                onChange={(e) => handleHexInputChange(e.target.value)}
                className="w-full bg-transparent text-xs font-mono font-extrabold uppercase text-slate-800 outline-none"
                placeholder="FFFFFF"
              />
              <button
                type="button"
                onClick={handleCopyHex}
                title="Salin kode hex"
                className="ml-1 text-slate-400 hover:text-slate-700"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            </div>

            {/* Eyedropper Button (if supported) */}
            {hasEyeDropper && (
              <button
                type="button"
                onClick={handleEyeDropper}
                title="Ambil warna dari layar (Eyedropper)"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition"
              >
                <Pipette size={14} />
              </button>
            )}
          </div>

          {/* Preset Swatches Palette */}
          <div>
            <span className="mb-1.5 block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Palet Populer
            </span>
            <div className="grid grid-cols-7 gap-1.5">
              {PRESET_SWATCHES.map((swatch) => {
                const isSelected = currentColor.toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => onChange(swatch.hex)}
                    title={`${swatch.name} (${swatch.hex})`}
                    className={`group relative h-6 w-6 rounded-lg border transition hover:scale-115 active:scale-95 ${
                      isSelected
                        ? "border-emerald-600 ring-2 ring-emerald-400/50 shadow-xs"
                        : "border-black/10 hover:border-slate-400"
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {isSelected && (
                      <Check
                        size={11}
                        className={`absolute inset-0 m-auto ${
                          swatch.hex === "#FFFFFF" || swatch.hex === "#FDFBF7"
                            ? "text-slate-800"
                            : "text-white"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Footer Action */}
          {onReset && value && value.toLowerCase() !== fallbackValue.toLowerCase() && (
            <div className="mt-3 border-t border-slate-100 pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-700"
              >
                <RotateCcw size={11} />
                <span>Kembalikan Bawaan Tema</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
