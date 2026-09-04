"use client";

import { Bold, ChevronDown, Italic, RotateCcw, Type } from "lucide-react";
import type { TemplateEditorField } from "@/templates/contracts";
import { FigmaColorPicker } from "./FigmaColorPicker";
import { EditorSelect, type SelectOption } from "./EditorSelect";

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
  textStyleOpen?: boolean;
  activeCollaborator?: { name: string; color: string } | null;
  onFocus?: () => void;
  onBlur?: () => void;
  onTextStyleOpenChange?: (open: boolean) => void;
  onValueChange: (value: string) => void;
  onTextStyleChange: (style: Partial<EditableTextStyle>, replace?: boolean) => void;
};

const fonts: SelectOption[] = [
  { value: "template", label: "Bawaan template", subtitle: "Mengikuti gaya template" },
  { value: "great-vibes", label: "Great Vibes", previewStyle: { fontFamily: "var(--font-great-vibes), cursive", fontSize: "17px" } },
  { value: "dancing-script", label: "Dancing Script", previewStyle: { fontFamily: "var(--font-dancing-script), cursive", fontSize: "16px" } },
  { value: "cormorant", label: "Cormorant Garamond", previewStyle: { fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "16px" } },
  { value: "manrope", label: "Manrope", previewStyle: { fontFamily: "var(--font-manrope), sans-serif" } },
];

export function EditableField({
  field,
  value,
  textStyle = {},
  textStyleOpen = false,
  activeCollaborator,
  onFocus,
  onBlur,
  onTextStyleOpenChange,
  onValueChange,
  onTextStyleChange,
}: EditableFieldProps) {
  const supportsTypography = field.control === "text" || field.control === "textarea";
  const isCollaborating = Boolean(activeCollaborator);
  const collaboratorColor = activeCollaborator?.color || "#10B981";

  const dynamicStyle = isCollaborating
    ? {
        borderColor: collaboratorColor,
        boxShadow: `0 0 0 3px ${collaboratorColor}26`,
      }
    : undefined;

  const inputClass = `mt-1.5 w-full rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 ${
    isCollaborating
      ? ""
      : "border-slate-300 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"
  }`;
  const updateStyle = <Key extends keyof EditableTextStyle>(key: Key, next: EditableTextStyle[Key]) =>
    onTextStyleChange({ [key]: next });
  const handleFocus = () => {
    if (supportsTypography) onTextStyleOpenChange?.(true);
    onFocus?.();
  };

  return (
    <div
      className={`rounded-2xl border bg-white p-3.5 shadow-xs transition ${
        isCollaborating ? "border-amber-300/80 bg-amber-50/10" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Field Label (Noticeable, Prominent & High-Contrast) */}
      <label className="block">
        <div className="flex items-center justify-between gap-2">
          <span className="block text-sm font-bold text-slate-900 tracking-tight leading-snug">
            {field.label}
          </span>
          {activeCollaborator && (
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs animate-in fade-in zoom-in-95 duration-150"
              style={{ backgroundColor: activeCollaborator.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {activeCollaborator.name} sedang mengedit
            </span>
          )}
        </div>
        {field.control === "textarea" ? (
          <textarea
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onFocus={handleFocus}
            onBlur={onBlur}
            rows={field.rows ?? 3}
            style={dynamicStyle}
            className={`${inputClass} resize-y`}
          />
        ) : (
          <input
            type={field.control}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onFocus={handleFocus}
            onBlur={onBlur}
            style={dynamicStyle}
            className={inputClass}
          />
        )}
      </label>

      {/* Typography stays compact until the related field is active. */}
      {supportsTypography && (
        <div className="mt-3 border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => onTextStyleOpenChange?.(!textStyleOpen)}
            aria-expanded={textStyleOpen}
            className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-left text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-emerald-700"
          >
            <span className="inline-flex items-center gap-1.5"><Type size={13} /> Gaya teks</span>
            <ChevronDown size={14} className={`transition-transform ${textStyleOpen ? "rotate-180" : ""}`} />
          </button>

          {textStyleOpen && (
            <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Font teks</span>
                <EditorSelect
                  value={textStyle.fontFamily ?? "template"}
                  options={fonts}
                  onChange={(fontFamily) => updateStyle("fontFamily", fontFamily)}
                  className="!w-full min-w-0"
                />
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_76px_auto] items-center gap-2">
                <FigmaColorPicker compact label="Warna" value={textStyle.color} fallbackValue="#382326" onChange={(color) => updateStyle("color", color)} />

                <label className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 transition focus-within:border-emerald-500 focus-within:bg-white">
                  <input
                    type="number"
                    min={8}
                    max={120}
                    value={textStyle.fontSize ?? ""}
                    onChange={(event) => updateStyle("fontSize", event.target.value ? Math.min(120, Math.max(8, Number(event.target.value))) : undefined)}
                    placeholder="Auto"
                    className="w-full bg-transparent text-center text-[11px] font-bold text-slate-800 outline-none"
                    aria-label={`Ukuran ${field.label}`}
                  />
                  <span className="select-none text-[10px] font-medium text-slate-400">px</span>
                </label>

                <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <button type="button" aria-label={`Bold ${field.label}`} aria-pressed={Boolean(textStyle.bold)} onClick={() => updateStyle("bold", !textStyle.bold)} className={`grid h-7 w-7 place-items-center transition ${textStyle.bold ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-200/70"}`}><Bold size={12} /></button>
                  <button type="button" aria-label={`Italic ${field.label}`} aria-pressed={Boolean(textStyle.italic)} onClick={() => updateStyle("italic", !textStyle.italic)} className={`grid h-7 w-7 place-items-center border-l border-slate-200 transition ${textStyle.italic ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-200/70"}`}><Italic size={12} /></button>
                </div>
              </div>

              <button type="button" onClick={() => onTextStyleChange({}, true)} className="inline-flex items-center gap-1.5 pt-0.5 text-[11px] font-semibold text-slate-400 transition hover:text-rose-600">
                <RotateCcw size={11} />
                <span>Reset gaya teks</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
