import type { TemplateNavigationAdapter, TemplateSectionEntry } from "@/templates/navigation/contracts";
import { weddingSectionSelectors } from "./source/template-bridge";

export class WeddingLampungNavigationAdapter implements TemplateNavigationAdapter {
  getScrollRoot() {
    return document.querySelector<HTMLElement>("[data-template-scroll-root]");
  }

  getSectionElement(sectionId: string) {
    return document.querySelector<HTMLElement>(`[data-template-section="${CSS.escape(sectionId)}"]`) ?? this.getByLegacySelector(sectionId);
  }

  getSectionEntries(): TemplateSectionEntry[] {
    return Object.keys(weddingSectionSelectors).flatMap((id) => {
      const element = this.getSectionElement(id);
      return element ? [{ id, element }] : [];
    });
  }

  prepareSection(sectionId: string) {
    window.dispatchEvent(new CustomEvent("wedding-preview-navigate", { detail: { sectionType: sectionId } }));
  }

  isSectionReady(sectionId: string) {
    if (sectionId === "opening-envelope") return Boolean(this.getSectionElement(sectionId));
    const root = this.getScrollRoot();
    return Boolean(root?.dataset.opened === "true" && root.scrollHeight > root.clientHeight);
  }

  getOpeningSectionId() {
    return "opening-envelope";
  }

  private getByLegacySelector(sectionId: string) {
    const selector = weddingSectionSelectors[sectionId as keyof typeof weddingSectionSelectors];
    return selector ? document.querySelector<HTMLElement>(selector) : null;
  }
}
