"use client";

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

  if (!selected) {
    return (
      <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
        Pilih section pada struktur untuk mulai mengedit.
      </p>
    );
  }

  const defaultData = selected.defaultData || {};

  return (
    <div>
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
        {(selected.fields ?? []).map((field) => {
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

          return (
            <EditableField
              key={field.key}
              field={field}
              value={value}
              textStyle={style}
              activeCollaborator={collaborator}
              onFocus={() => broadcastFieldFocus?.(selected.id, field.key)}
              onBlur={() => broadcastFieldFocus?.(selected.id, null)}
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

      {/* Component Photo Field (Single image or Gallery) */}
      {defaultData.imageLabel !== undefined && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <AssetUploadField
            title="Foto komponen"
            urls={
              selected.type === "gallery"
                ? Array.isArray(defaultData.imageUrls)
                  ? (defaultData.imageUrls.filter((url): url is string => typeof url === "string") as string[])
                  : []
                : typeof defaultData.imageUrl === "string" && defaultData.imageUrl
                ? [defaultData.imageUrl]
                : []
            }
            hint={String(defaultData.imageLabel || "Pilih foto dari Asset Manager")}
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
