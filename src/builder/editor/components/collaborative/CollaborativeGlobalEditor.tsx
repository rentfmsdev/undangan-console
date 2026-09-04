"use client";

import { Monitor, Smartphone } from "lucide-react";
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
  useContainer?: boolean;
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
  useContainer = true,
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
    <div className="w-full min-w-0 max-w-full space-y-3">
      {/* 1. Music Selector & Volume Slider Card */}
      <div className="w-full min-w-0 max-w-full rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
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
          <p role="alert" className="mt-2 w-full min-w-0 max-w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold leading-4 text-rose-700">
            {uploadError}
          </p>
        )}
      </div>

      {/* 2. Fokuskan untuk Layar (Mobile vs Desktop) Card */}
      <div className="w-full min-w-0 max-w-full rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs space-y-2.5">
        <div className="flex w-full min-w-0 max-w-full items-center justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-800">Fokuskan untuk Layar</p>
            <p className="truncate text-[10px] text-slate-400">Tata letak saat dibuka di layar komputer/desktop</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700">Layout</span>
        </div>
        <div className="grid w-full min-w-0 max-w-full grid-cols-2 gap-1.5 sm:gap-2">
          <button
            type="button"
            disabled={isViewer}
            onClick={() => updateGlobalSetting("useContainer", true)}
            className={`flex w-full min-w-0 max-w-full items-center gap-2 rounded-xl border p-2 text-left transition ${
              useContainer !== false
                ? "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            title="Tampilan Terpusat Card Mobile 480px di Layar Desktop"
          >
            <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition ${
              useContainer !== false ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-600"
            }`}>
              <Smartphone size={14} />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <b className="block truncate text-xs font-semibold">Mobile</b>
              <small className={`block truncate text-[9px] ${
                useContainer !== false ? "text-emerald-700 font-medium" : "text-slate-500"
              }`}>
                Card 480px
              </small>
            </div>
          </button>

          <button
            type="button"
            disabled={isViewer}
            onClick={() => updateGlobalSetting("useContainer", false)}
            className={`flex w-full min-w-0 max-w-full items-center gap-2 rounded-xl border p-2 text-left transition ${
              useContainer === false
                ? "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            title="Tampilan Lebar Penuh Responsif di Layar Desktop"
          >
            <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition ${
              useContainer === false ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-600"
            }`}>
              <Monitor size={14} />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <b className="block truncate text-xs font-semibold">Desktop</b>
              <small className={`block truncate text-[9px] ${
                useContainer === false ? "text-emerald-700 font-medium" : "text-slate-500"
              }`}>
                Lebar Penuh
              </small>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Preset Themes Grid Card */}
      <div className="w-full min-w-0 max-w-full rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs space-y-2.5">
        <div className="flex w-full min-w-0 max-w-full items-center justify-between gap-1.5">
          <p className="truncate text-xs font-bold text-slate-800">Preset Theme</p>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700">Global</span>
        </div>
        <div className="grid w-full min-w-0 max-w-full grid-cols-2 gap-1.5 sm:gap-2">
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
                className={`w-full min-w-0 max-w-full rounded-xl border p-2 text-left transition ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="mb-1.5 flex gap-1">
                  {[item.colors.primary, item.colors.accent, item.colors.background].map((color) => (
                    <i key={color} className="h-3 w-3 rounded-full border border-black/10 shrink-0" style={{ background: color }} />
                  ))}
                </span>
                <b className="block truncate text-[10px] text-slate-800">{item.label}</b>
                <small className="mt-0.5 block truncate text-[8px] text-slate-500">{item.fonts.display}</small>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Custom Color Palette Card */}
      <div className="w-full min-w-0 max-w-full rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs space-y-2.5">
        <div className="flex w-full min-w-0 max-w-full flex-wrap items-center justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-800">Kustom Warna Tema</p>
            <p className="truncate text-[10px] text-slate-400">Sesuaikan dengan tema busana/dekorasi</p>
          </div>
          {hasCustomColors && (
            <button
              type="button"
              disabled={isViewer}
              onClick={() => updateGlobalSetting("customColors", {})}
              className="shrink-0 text-[10px] font-bold text-emerald-700 hover:underline disabled:opacity-50"
            >
              Reset ke tema
            </button>
          )}
        </div>

        <div className="w-full min-w-0 max-w-full space-y-2">
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
