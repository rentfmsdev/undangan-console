"use client";

import { useState } from "react";
import type { TemplateKit } from "@/templates/contracts";
import type { EditableSection } from "@/builder/editor/ConsoleWorkspace";
import { EditableField, type EditableTextStyle } from "../EditableField";
import { AssetUploadField } from "../AssetUploadField";
import { CollaborativeColorInput } from "./CollaborativeColorInput";
import { useCollaborative } from "./CollaborativeContext";

type Props = {
  template: TemplateKit;
  selected: EditableSection | undefined;
  themeBackground: string;
  uploadError?: string;
  onOpenContentLibrary: () => void;
  onOpenBackgroundLibrary: () => void;
};

export function CollaborativeSectionInspector({
  template,
  selected,
  themeBackground,
  uploadError,
  onOpenContentLibrary,
  onOpenBackgroundLibrary,
}: Props) {
  const { isViewer, updateField, updateFields, updateTextStyle, activeFieldCollaborator, broadcastFieldFocus } = useCollaborative();
  const [activeTextStyleField, setActiveTextStyleField] = useState<string | null>(null);

  if (!selected) {
    return (
      <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
        Pilih section pada struktur untuk mulai mengedit.
      </p>
    );
  }

  const defaultData = selected.defaultData || {};

  return (
    <div className="w-full min-w-0 max-w-full">
      {/* Section Header & Visibility Badge */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
        <div className="min-w-0">
          <strong className="block truncate text-sm text-slate-800">{selected.label}</strong>
          <small className="block truncate text-[10px] text-slate-500">{selected.description}</small>
        </div>
        <span
          className={`ml-3 shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold ${
            selected.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"
          }`}
        >
          {selected.enabled ? "Tampil" : "Tersembunyi"}
        </span>
      </div>

      {/* Dynamic Fields List */}
      <div className="space-y-3">
        {(selected.fields ?? []).filter((field) => !(selected.type === "gift" && ["bank2", "account2", "holder2"].includes(field.key))).map((field) => {
          const value = typeof defaultData[field.key] === "string" ? String(defaultData[field.key]) : "";
          const textStyles =
            defaultData.textStyles && typeof defaultData.textStyles === "object"
              ? (defaultData.textStyles as Record<string, EditableTextStyle>)
              : {};
          const legacyFonts =
            defaultData.fontStyles && typeof defaultData.fontStyles === "object"
              ? (defaultData.fontStyles as Record<string, string>)
              : {};
          const style = textStyles[field.key] ?? (legacyFonts[field.key] ? { fontFamily: legacyFonts[field.key] } : {});
          const collaborator = activeFieldCollaborator?.(selected.id, field.key) ?? null;
          const textStyleFieldId = `${selected.id}:${field.key}`;

          return (
            <EditableField
              key={field.key}
              field={field}
              value={value}
              textStyle={style}
              textStyleOpen={activeTextStyleField === textStyleFieldId}
              activeCollaborator={collaborator}
              onFocus={() => broadcastFieldFocus?.(selected.id, field.key)}
              onBlur={() => broadcastFieldFocus?.(selected.id, null)}
              onTextStyleOpenChange={(open) => setActiveTextStyleField(open ? textStyleFieldId : null)}
              onValueChange={(nextValue) => {
                updateField(selected.id, field.key, nextValue);
              }}
              onTextStyleChange={(nextStyle, replace) => {
                updateTextStyle(selected.id, field.key, nextStyle, replace);
              }}
            />
          );
        })}
      </div>

      {selected.type === "gift" && ([
        { key: "showBank", label: "Tampilkan rekening", description: "Sembunyikan data rekening tanpa menghapus isinya.", icon: "¤" },
        { key: "showQris", label: "Tampilkan QRIS", description: "Gambar tetap tersimpan saat disembunyikan.", icon: "▦" },
      ] as const).map((control, index) => (
        <div key={control.key} className={`${index ? "mt-2" : "mt-5"} flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3`}>
          <div className="flex items-center justify-between gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700" aria-hidden="true">{control.icon}</span>
            <div className="min-w-0">
              <strong className="block text-xs font-extrabold text-slate-800">{control.label}</strong>
              <span className="mt-0.5 block text-[10px] text-slate-500">{control.description}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <button
              type="button"
              role="switch"
              aria-checked={defaultData[control.key] !== false}
              disabled={isViewer}
              onClick={() => updateField(selected.id, control.key, defaultData[control.key] === false)}
              className={`relative h-6 w-11 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                defaultData[control.key] !== false ? "border-emerald-600 bg-emerald-600 shadow-sm shadow-emerald-200" : "border-slate-300 bg-slate-200"
              }`}
            >
              <span className={`absolute left-0.5 top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform ${defaultData[control.key] !== false ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <span className={`text-[9px] font-extrabold uppercase tracking-[.1em] ${defaultData[control.key] !== false ? "text-emerald-700" : "text-slate-400"}`}>{defaultData[control.key] !== false ? "Aktif" : "Nonaktif"}</span>
          </div>
        </div>
      ))}

      {selected.type === "gift" && (
        <div className="mt-2 rounded-xl border border-dashed border-violet-200 bg-white p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <strong className="block text-xs font-extrabold text-slate-800">Rekening kedua</strong>
              <span className="mt-0.5 block text-[10px] text-slate-500">Tambahkan bank atau e-wallet lain.</span>
            </div>
            {defaultData.hasSecondAccount === true ? (
              <button type="button" disabled={isViewer} onClick={() => updateFields(selected.id, { hasSecondAccount: false })} className="rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold text-rose-600 hover:bg-rose-50 disabled:opacity-50">Hapus</button>
            ) : (
              <button type="button" disabled={isViewer} onClick={() => updateFields(selected.id, { hasSecondAccount: true })} className="rounded-lg bg-violet-600 px-3 py-1.5 text-[10px] font-extrabold text-white shadow-sm shadow-violet-200 hover:bg-violet-700 disabled:opacity-50">+ Tambah rekening</button>
            )}
          </div>
          {defaultData.hasSecondAccount === true && (
            <div className="mt-3 grid gap-2.5 border-t border-violet-100 pt-3">
              {[
                ["bank2", "Nama bank / e-wallet kedua", "Contoh: DANA"],
                ["account2", "Nomor rekening kedua", "Nomor rekening atau e-wallet"],
                ["holder2", "Nama pemilik kedua", "Nama pemilik rekening"],
              ].map(([key, label, placeholder]) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-[10px] font-bold text-slate-600">{label}</span>
                  <input
                    type="text"
                    value={typeof defaultData[key] === "string" ? defaultData[key] : ""}
                    placeholder={placeholder}
                    disabled={isViewer}
                    onFocus={() => broadcastFieldFocus?.(selected.id, key)}
                    onBlur={() => broadcastFieldFocus?.(selected.id, null)}
                    onChange={(event) => updateField(selected.id, key, event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-violet-500 focus:bg-white disabled:opacity-50"
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Component Photo Field (Single image or Gallery) */}
      {(defaultData.imageLabel !== undefined || selected.type === "gallery" || Boolean(selected.capabilities?.gallery) || Boolean(selected.capabilities?.image)) && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <AssetUploadField
            title={selected.type === "gallery" ? "Foto galeri (Maks 4)" : "Foto komponen"}
            urls={
              selected.type === "gallery"
                ? Array.isArray(defaultData.imageUrls)
                  ? (defaultData.imageUrls.filter((url): url is string => typeof url === "string") as string[])
                  : []
                : typeof defaultData.imageUrl === "string" && defaultData.imageUrl
                ? [defaultData.imageUrl]
                : []
            }
            hint={String(defaultData.imageLabel || (selected.type === "gallery" ? "Pilih foto dari Asset Manager (Maks 4)" : "Pilih foto dari Asset Manager"))}
            onOpenLibrary={onOpenContentLibrary}
            onRemove={(index) => {
              if (selected.type === "gallery") {
                const current = Array.isArray(defaultData.imageUrls)
                  ? (defaultData.imageUrls.filter((url): url is string => typeof url === "string") as string[])
                  : [];
                const imageUrls = current.filter((_, itemIndex) => itemIndex !== index);
                updateFields(selected.id, {
                  imageUrls,
                  imageLabel: imageUrls.length ? `${imageUrls.length} foto galeri` : "",
                });
              } else {
                updateFields(selected.id, {
                  imageUrl: "",
                  imageLabel: "",
                });
              }
            }}
          />
        </div>
      )}

      {/* Section Background Customization */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500">Background section</p>
          {defaultData.backgroundColor && (
            <button
              type="button"
              disabled={isViewer}
              onClick={() => updateField(selected.id, "backgroundColor", "")}
              className="text-[9px] font-bold text-emerald-700 hover:underline disabled:opacity-50"
            >
              Reset warna
            </button>
          )}
        </div>

        <div className="mb-3">
          <CollaborativeColorInput
            label="Warna background"
            value={typeof defaultData.backgroundColor === "string" ? defaultData.backgroundColor : ""}
            fallbackValue={themeBackground}
            disabled={isViewer}
            onChange={(color) => {
              updateField(selected.id, "backgroundColor", color);
            }}
            onReset={() => updateField(selected.id, "backgroundColor", "")}
          />
        </div>

        <AssetUploadField
          title="Background image"
          urls={typeof defaultData.backgroundImageUrl === "string" && defaultData.backgroundImageUrl ? [defaultData.backgroundImageUrl] : []}
          hint={String(defaultData.backgroundImageLabel || "Pilih background dari Asset Manager")}
          onOpenLibrary={onOpenBackgroundLibrary}
          onRemove={() => {
            updateFields(selected.id, {
              backgroundImageUrl: "",
              backgroundImageLabel: "",
            });
          }}
        />

        {uploadError && (
          <p role="alert" className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold leading-4 text-rose-700">
            {uploadError}
          </p>
        )}
      </div>
    </div>
  );
}
