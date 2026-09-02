import type { ComponentType } from "react";
import type { TemplateNavigationAdapter } from "./navigation/contracts";
import WeddingLampungSource from "./wedding-lampung-elegance/source/WeddingLampungSource";
import { WeddingLampungNavigationAdapter } from "./wedding-lampung-elegance/navigation-adapter";
import { normalizeWeddingSectionState } from "./wedding-lampung-elegance/normalize-section-state";
import { applyWeddingTemplateState, watchWeddingTemplateState, type WeddingGlobalSettings, type WeddingPreviewSection } from "./wedding-lampung-elegance/source/template-bridge";
import type { TemplateKit } from "./contracts";
import BirthdayCelestialSource from "./birthday-celestial/source/BirthdayCelestialSource";
import { BirthdayCelestialNavigationAdapter } from "./birthday-celestial/navigation-adapter";
import { normalizeBirthdaySectionState } from "./birthday-celestial/normalize-section-state";
import { applyBirthdayTemplateState, watchBirthdayTemplateState, type BirthdayPreviewSection } from "./birthday-celestial/source/template-bridge";

export type RuntimeState = { sections: unknown[]; themeId: string; settings: Record<string, unknown> };
export type StoredTemplateSection = { id: string; type: string; enabled: boolean; data: Record<string, unknown> };
export type NormalizedTemplateSection = StoredTemplateSection;

export type TemplateRuntime = {
  templateId: string;
  code: string;
  Renderer: ComponentType<{ invitationId?: string; verifiedGuestName?: string }>;
  createNavigationAdapter: () => TemplateNavigationAdapter;
  normalizeSections: (template: TemplateKit, records: StoredTemplateSection[], createId: (type: string) => string) => NormalizedTemplateSection[];
  applyState: (state: RuntimeState) => void;
  watchState: (state: RuntimeState) => () => void;
};

const weddingLampungRuntime: TemplateRuntime = {
  templateId: "wedding-lampung-elegance",
  code: "hjydg",
  Renderer: WeddingLampungSource,
  createNavigationAdapter: () => new WeddingLampungNavigationAdapter(),
  normalizeSections: normalizeWeddingSectionState,
  applyState: ({ sections, themeId, settings }) => applyWeddingTemplateState(sections as WeddingPreviewSection[], themeId, settings as WeddingGlobalSettings),
  watchState: ({ sections, themeId, settings }) => watchWeddingTemplateState(sections as WeddingPreviewSection[], themeId, settings as WeddingGlobalSettings),
};

const birthdayCelestialRuntime: TemplateRuntime = {
  templateId: "birthday-celestial",
  code: "bdcel",
  Renderer: BirthdayCelestialSource,
  createNavigationAdapter: () => new BirthdayCelestialNavigationAdapter(),
  normalizeSections: normalizeBirthdaySectionState,
  applyState: ({ sections, themeId, settings }) => applyBirthdayTemplateState(sections as BirthdayPreviewSection[], themeId, (settings ?? {}) as Parameters<typeof applyBirthdayTemplateState>[2]),
  watchState: ({ sections, themeId, settings }) => watchBirthdayTemplateState(sections as BirthdayPreviewSection[], themeId, (settings ?? {}) as Parameters<typeof watchBirthdayTemplateState>[2]),
};

export const templateRuntimeRegistry: TemplateRuntime[] = [weddingLampungRuntime, birthdayCelestialRuntime];

export function getTemplateRuntime(code: string) {
  return templateRuntimeRegistry.find((runtime) => runtime.code === code || runtime.templateId === code) ?? weddingLampungRuntime;
}
