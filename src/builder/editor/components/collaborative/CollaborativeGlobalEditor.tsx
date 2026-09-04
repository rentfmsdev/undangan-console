"use client";

import type { TemplateKit } from "@/templates/contracts";
import { MusicSelectorField } from "../MusicSelectorField";
import { CollaborativeColorInput } from "./CollaborativeColorInput";
import { useCollaborative } from "./CollaborativeContext";

type Props = {
  template: TemplateKit;
  themeId: string;
  musicUrl: string;
  musicVolume: number;
  customColors: { primary?: string; accent?: string; background?: string };
  authResolved: boolean;
  isLoggedIn: boolean;
  draftReady: boolean;
  uploadError?: string;
  onOpenMusicLibrary: () => void;
  onRequestLogin: (reason: string) => void;
};

export function CollaborativeGlobalEditor({
  template,
  themeId,
  musicUrl,
  musicVolume,
  customColors,
  authResolved,
  isLoggedIn,
  draftReady,
  uploadError,
  onOpenMusicLibrary,
  onRequestLogin,
}: Props) {
  const { isViewer, disabled, updateGlobalSetting } = useCollaborative();
  const activeTheme = template.themes.find((t) => t.id === themeId) ?? template.themes[0];

  const hasCustomColors = Boolean(
    customColors.primary || customColors.accent || customColors.background
  );

  return (
    <div className="space-y-4">
      {/* 1. Music Selector & Volume Slider */}
      <MusicSelectorField
        musicUrl={musicUrl}
        volume={musicVolume}
        category={template.category}
        disabled={disabled || !authResolved || (isLoggedIn && !draftReady)}
        onChange={(nextUrl) => {
          if (!authResolved) return;
          if (!isLoggedIn) {
            onRequestLogin("Masuk dengan Google untuk memilih musik undangan.");
            return;
          }
          updateGlobalSetting("musicUrl", nextUrl);
        }}
        onVolumeChange={(nextVol) => {
          updateGlobalSetting("musicVolume", nextVol);
        }}
        onOpenLibrary={onOpenMusicLibrary}
      />

      {uploadError && (
        <p role="alert" className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold leading-4 text-rose-700">
          {uploadError}
        </p>
      )}

      {/* 2. Preset Themes Grid */}
      <div className="border-t border-slate-100 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700">Preset Theme</p>
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Global</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {template.themes.map((item) => {
            const isSelected = themeId === item.id && !hasCustomColors;
            return (
              <button
                key={item.id}
                type="button"
                disabled={isViewer}
                onClick={() => {
                  updateGlobalSetting("themeId", item.id);
                  updateGlobalSetting("customColors", {});
                }}
                className={`min-w-0 rounded-xl border p-2.5 text-left transition ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="mb-2 flex gap-1">
                  {[item.colors.primary, item.colors.accent, item.colors.background].map((color) => (
                    <i key={color} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: color }} />
                  ))}
                </span>
                <b className="block truncate text-[10px] text-slate-800">{item.label}</b>
                <small className="mt-0.5 block truncate text-[8px] text-slate-500">{item.fonts.display}</small>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Custom Color Palette */}
      <div className="border-t border-slate-100 pt-4">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-700">Kustom Warna Tema</p>
            <p className="text-[10px] text-slate-400">Sesuaikan dengan tema busana/dekorasi</p>
          </div>
          {hasCustomColors && (
            <button
              type="button"
              disabled={isViewer}
              onClick={() => updateGlobalSetting("customColors", {})}
              className="text-[10px] font-bold text-emerald-700 hover:underline disabled:opacity-50"
            >
              Reset ke tema
            </button>
          )}
        </div>

        <div className="space-y-2">
          <CollaborativeColorInput
            label="Warna Utama (Primary)"
            value={customColors.primary}
            fallbackValue={activeTheme.colors.primary}
            disabled={isViewer}
            onChange={(val) => {
              updateGlobalSetting("customColors", { ...customColors, primary: val });
            }}
          />

          <CollaborativeColorInput
            label="Warna Aksen (Accent / Gold)"
            placement="top"
            value={customColors.accent}
            fallbackValue={activeTheme.colors.accent}
            disabled={isViewer}
            onChange={(val) => {
              updateGlobalSetting("customColors", { ...customColors, accent: val });
            }}
          />

          <CollaborativeColorInput
            label="Warna Latar (Background)"
            placement="top"
            value={customColors.background}
            fallbackValue={activeTheme.colors.background}
            disabled={isViewer}
            onChange={(val) => {
              updateGlobalSetting("customColors", { ...customColors, background: val });
            }}
          />
        </div>
      </div>
    </div>
  );
}
