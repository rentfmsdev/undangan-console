"use client";

import { RotateCcw } from "lucide-react";
import type { CardStyleSettings } from "@/modules/share-card/contracts";
import { FigmaColorPicker } from "./FigmaColorPicker";
import { AssetUploadField } from "./AssetUploadField";

type Props = {
  value: CardStyleSettings;
  templateBackground: string;
  templateAccent: string;
  templateText: string;
  disabled?: boolean;
  onChange: (next: CardStyleSettings) => void;
  onChooseImage: () => void;
  onReset: () => void;
};

const STYLE_OPTIONS = [
  { id: "template", label: "Template", description: "Motif mengikuti karakter template." },
  { id: "elegant", label: "Elegan", description: "Bingkai klasik untuk kartu formal." },
  { id: "minimal", label: "Minimal", description: "Tampilan ringkas dan modern." },
] as const;

function CardStyleSwitch({ checked, disabled, label, onChange }: { checked: boolean; disabled: boolean; label: string; onChange: (checked: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"><span>{label}</span><span className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? "bg-emerald-600" : "bg-slate-300"}`}><span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} /></span></button>;
}

export function CardStyleEditor({ value, templateBackground, templateAccent, templateText, disabled = false, onChange, onChooseImage, onReset }: Props) {
  const update = (patch: Partial<CardStyleSettings>) => onChange({ ...value, ...patch });
  const updateColor = (key: keyof NonNullable<CardStyleSettings["colors"]>, color: string) =>
    update({ colors: { ...value.colors, [key]: color } });

  return (
    <div className="mt-3 space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <p className="text-xs font-extrabold text-slate-900">Gaya kartu</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">Dipakai pada preview WhatsApp dan Open Graph.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {STYLE_OPTIONS.map((style) => (
            <button key={style.id} type="button" disabled={disabled} onClick={() => update({ styleId: style.id })} className={`rounded-xl border p-2 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${value.styleId === style.id ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"}`}>
              <span className={`block h-8 rounded-lg ${style.id === "elegant" ? "border border-amber-300 bg-stone-800" : style.id === "minimal" ? "bg-slate-900" : ""}`} style={style.id === "template" ? { background: `linear-gradient(135deg, ${templateBackground}, ${templateAccent})` } : undefined} />
              <strong className="mt-2 block text-[10px] text-slate-800">{style.label}</strong>
              <span className="mt-0.5 block text-[9px] leading-3 text-slate-500">{style.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <p className="text-xs font-extrabold text-slate-900">Latar belakang</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["template", "photo", "solid"] as const).map((mode) => (
            <button key={mode} type="button" disabled={disabled} onClick={() => update({ backgroundMode: mode })} className={`rounded-xl border px-2 py-2 text-[10px] font-bold capitalize transition disabled:cursor-not-allowed disabled:opacity-55 ${value.backgroundMode === mode ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{mode === "photo" ? "Foto" : mode === "solid" ? "Warna" : "Template"}</button>
          ))}
        </div>
        {value.backgroundMode === "photo" && <div className="mt-3 space-y-3"><AssetUploadField title="Foto kartu" urls={value.imageUrl ? [value.imageUrl] : []} hint="Pilih foto dari Asset Manager" disabled={disabled} onOpenLibrary={onChooseImage} onRemove={() => update({ imageUrl: undefined })} /><label className="block text-[10px] font-bold text-slate-600">Overlay {Math.round(value.overlayOpacity * 100)}%<input type="range" min="20" max="90" step="5" value={Math.round(value.overlayOpacity * 100)} disabled={disabled} onChange={(event) => update({ overlayOpacity: Number(event.target.value) / 100 })} className="mt-1.5 w-full accent-emerald-600" /></label></div>}
        {value.backgroundMode === "solid" && <div className="mt-3"><FigmaColorPicker label="Warna latar" value={value.colors?.background} fallbackValue={templateBackground} disabled={disabled} onChange={(color) => updateColor("background", color)} onReset={() => update({ colors: { ...value.colors, background: undefined } })} /></div>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <p className="text-xs font-extrabold text-slate-900">Informasi dan warna</p>
        <div className="mt-3 grid grid-cols-2 gap-2"><FigmaColorPicker compact label="Aksen" value={value.colors?.accent} fallbackValue={templateAccent} disabled={disabled} onChange={(color) => updateColor("accent", color)} onReset={() => update({ colors: { ...value.colors, accent: undefined } })} /><FigmaColorPicker compact label="Teks" value={value.colors?.text} fallbackValue={templateText} disabled={disabled} onChange={(color) => updateColor("text", color)} onReset={() => update({ colors: { ...value.colors, text: undefined } })} /></div>
        <div className="mt-3 flex rounded-xl border border-slate-200 p-1"><button type="button" disabled={disabled} onClick={() => update({ textAlign: "left" })} className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold ${value.textAlign === "left" ? "bg-slate-900 text-white" : "text-slate-500"}`}>Kiri</button><button type="button" disabled={disabled} onClick={() => update({ textAlign: "center" })} className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold ${value.textAlign === "center" ? "bg-slate-900 text-white" : "text-slate-500"}`}>Tengah</button></div>
        <div className="mt-3 space-y-2">{([ ["showGuestName", "Nama tamu"], ["showDate", "Tanggal & jam"], ["showVenue", "Lokasi"] ] as const).map(([key, label]) => <CardStyleSwitch key={key} label={label} checked={value[key]} disabled={disabled} onChange={(checked) => update({ [key]: checked })} />)}</div>
      </section>

      <button type="button" disabled={disabled} onClick={onReset} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 disabled:opacity-50"><RotateCcw size={13} /> Reset gaya kartu</button>
    </div>
  );
}
