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
import { KhitanKsatriaSource } from "./khitan-ksatria-jawa/source/KhitanKsatriaSource";
import { KhitanKsatriaNavigationAdapter } from "./khitan-ksatria-jawa/navigation-adapter";
import { normalizeKhitanSectionState } from "./khitan-ksatria-jawa/normalize-section-state";
import { applyKhitanTemplateState, watchKhitanTemplateState, type KhitanPreviewSection } from "./khitan-ksatria-jawa/source/template-bridge";
import { AqiqahLittleBloomSource } from "./aqiqah-little-bloom/source/AqiqahLittleBloomSource";
import { AqiqahLittleBloomNavigationAdapter } from "./aqiqah-little-bloom/navigation-adapter";
import { normalizeAqiqahSectionState } from "./aqiqah-little-bloom/normalize-section-state";
import { applyAqiqahTemplateState, watchAqiqahTemplateState, type AqiqahPreviewSection, type AqiqahGlobalSettings } from "./aqiqah-little-bloom/source/template-bridge";

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

const khitanKsatriaRuntime: TemplateRuntime = {
  templateId: "khitan-ksatria-jawa",
  code: "khtnn",
  Renderer: KhitanKsatriaSource,
  createNavigationAdapter: () => new KhitanKsatriaNavigationAdapter(),
  normalizeSections: normalizeKhitanSectionState,
  applyState: ({ sections, themeId, settings }) => applyKhitanTemplateState(sections as KhitanPreviewSection[], themeId, (settings ?? {}) as Parameters<typeof applyKhitanTemplateState>[2]),
  watchState: ({ sections, themeId, settings }) => watchKhitanTemplateState(sections as KhitanPreviewSection[], themeId, (settings ?? {}) as Parameters<typeof watchKhitanTemplateState>[2]),
};

const aqiqahLittleBloomRuntime: TemplateRuntime = {
  templateId: "aqiqah-little-bloom",
  code: "aqiqh",
  Renderer: AqiqahLittleBloomSource,
  createNavigationAdapter: () => new AqiqahLittleBloomNavigationAdapter(),
  normalizeSections: normalizeAqiqahSectionState,
  applyState: ({ sections, themeId, settings }) => applyAqiqahTemplateState(sections as AqiqahPreviewSection[], themeId, settings as AqiqahGlobalSettings),
  watchState: ({ sections, themeId, settings }) => watchAqiqahTemplateState(sections as AqiqahPreviewSection[], themeId, settings as AqiqahGlobalSettings),
};

export const templateRuntimeRegistry: TemplateRuntime[] = [
  weddingLampungRuntime,
  birthdayCelestialRuntime,
  khitanKsatriaRuntime,
  aqiqahLittleBloomRuntime,
];

export function getTemplateRuntime(code: string) {
  return templateRuntimeRegistry.find((runtime) => runtime.code === code || runtime.templateId === code) ?? weddingLampungRuntime;
}
