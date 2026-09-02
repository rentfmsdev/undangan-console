"use client";

import { Bold, Italic, RotateCcw } from "lucide-react";
import type { TemplateEditorField } from "@/templates/contracts";

export type EditableTextStyle = {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
};

type EditableFieldProps = {
  field: TemplateEditorField;
  value: string;
  textStyle?: EditableTextStyle;
  onValueChange: (value: string) => void;
  onTextStyleChange: (style: Partial<EditableTextStyle>, replace?: boolean) => void;
};

const fonts = [
  ["template", "Bawaan template"],
  ["great-vibes", "Great Vibes"],
  ["dancing-script", "Dancing Script"],
  ["cormorant", "Cormorant Garamond"],
  ["manrope", "Manrope"],
] as const;

export function EditableField({
  field,
  value,
  textStyle = {},
  onValueChange,
  onTextStyleChange,
}: EditableFieldProps) {
  const supportsTypography = field.control === "text" || field.control === "textarea";
  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100 placeholder:text-slate-400";
  const updateStyle = <Key extends keyof EditableTextStyle>(key: Key, next: EditableTextStyle[Key]) =>
    onTextStyleChange({ [key]: next });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-slate-300">
      {/* Field Label (Noticeable, Prominent & High-Contrast) */}
      <label className="block">
        <span className="block text-sm font-bold text-slate-900 tracking-tight leading-snug">
          {field.label}
        </span>
        {field.control === "textarea" ? (
          <textarea
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            rows={field.rows ?? 3}
            className={`${inputClass} resize-y`}
          />
        ) : (
          <input
            type={field.control}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            className={inputClass}
          />
        )}
      </label>

      {/* Typography Controls Toolbar */}
      {supportsTypography && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
          {/* Row 1: Font Family Selector */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500" style={{ fontSize: "11px" }}>Font teks</span>
            <select
              value={textStyle.fontFamily ?? "template"}
              onChange={(event) => updateStyle("fontFamily", event.target.value)}
              className="min-w-0 max-w-[170px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white cursor-pointer"
              style={{ fontSize: "11px" }}
            >
              {fonts.map(([id, label]) => (
                <option key={id} value={id} style={{ fontSize: "11px" }}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Row 2: Color, Font Size & Style formatting */}
          <div className="grid grid-cols-[minmax(0,1fr)_76px_auto] items-center gap-2">
            <label
              className="flex min-w-0 items-center justify-between gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 cursor-pointer hover:border-slate-300 transition"
              style={{ fontSize: "11px" }}
            >
              <span>Warna</span>
              <input
                type="color"
                value={textStyle.color ?? "#382326"}
                onChange={(event) => updateStyle("color", event.target.value)}
                className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0 shrink-0"
                aria-label={`Warna ${field.label}`}
              />
            </label>

            <label
              className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 focus-within:border-emerald-500 focus-within:bg-white transition"
              style={{ fontSize: "11px" }}
            >
              <input
                type="number"
                min={8}
                max={120}
                value={textStyle.fontSize ?? ""}
                onChange={(event) =>
                  updateStyle(
                    "fontSize",
                    event.target.value ? Math.min(120, Math.max(8, Number(event.target.value))) : undefined
                  )
                }
                placeholder="Auto"
                className="w-full bg-transparent text-center text-[11px] font-bold text-slate-800 outline-none"
                style={{ fontSize: "11px" }}
                aria-label={`Ukuran ${field.label}`}
              />
              <span className="text-[10px] font-medium text-slate-400 select-none">px</span>
            </label>

            <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <button
                type="button"
                aria-label={`Bold ${field.label}`}
                aria-pressed={Boolean(textStyle.bold)}
                onClick={() => updateStyle("bold", !textStyle.bold)}
                className={`grid h-7 w-7 place-items-center transition ${textStyle.bold ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-200/70"
                  }`}
              >
                <Bold size={12} />
              </button>
              <button
                type="button"
                aria-label={`Italic ${field.label}`}
                aria-pressed={Boolean(textStyle.italic)}
                onClick={() => updateStyle("italic", !textStyle.italic)}
                className={`grid h-7 w-7 place-items-center border-l border-slate-200 transition ${textStyle.italic ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-200/70"
                  }`}
              >
                <Italic size={12} />
              </button>
            </div>
          </div>

          {/* Row 3: Reset Style */}
          <button
            type="button"
            onClick={() => onTextStyleChange({}, true)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition pt-0.5"
            style={{ fontSize: "11px" }}
          >
            <RotateCcw size={11} />
            <span>Reset gaya teks</span>
          </button>
        </div>
      )}
    </div>
  );
}
