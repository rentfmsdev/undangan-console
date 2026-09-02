import type { ComponentType } from "react";
import type { TemplateNavigationAdapter } from "./navigation/contracts";
import WeddingLampungSource from "./wedding-lampung-elegance/source/WeddingLampungSource";
import { WeddingLampungNavigationAdapter } from "./wedding-lampung-elegance/navigation-adapter";
import { normalizeWeddingSectionState } from "./wedding-lampung-elegance/normalize-section-state";
import { applyWeddingTemplateState, watchWeddingTemplateState, type WeddingGlobalSettings, type WeddingPreviewSection } from "./wedding-lampung-elegance/source/template-bridge";
import type { TemplateKit } from "./contracts";

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

export const templateRuntimeRegistry: TemplateRuntime[] = [weddingLampungRuntime];

export function getTemplateRuntime(code: string) {
  return templateRuntimeRegistry.find((runtime) => runtime.code === code || runtime.templateId === code) ?? weddingLampungRuntime;
}
