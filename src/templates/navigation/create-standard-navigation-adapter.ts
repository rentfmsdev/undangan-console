import type { TemplateNavigationAdapter, TemplateSectionEntry } from "./contracts";

export type StandardNavigationAdapterOptions = {
  /** Ordered manifest section types. Keep this equal to defaultSections. */
  sectionIds: readonly string[];
  /** Template-local event that only prepares visual state, e.g. opens an envelope. */
  prepareEvent: string;
  openingSectionId?: string;
  scrollRootSelector?: string;
};

/**
 * The shared navigation contract used by Wedding and every new template.
 * It deliberately owns no design code: templates only provide their section
 * order and a small preparation event for state such as an opening envelope.
 */
export class StandardTemplateNavigationAdapter implements TemplateNavigationAdapter {
  private readonly rootSelector: string;

  constructor(private readonly options: StandardNavigationAdapterOptions) {
    this.rootSelector = options.scrollRootSelector ?? "[data-template-scroll-root]";
  }

  getScrollRoot() {
    return document.querySelector<HTMLElement>(this.rootSelector);
  }

  getSectionElement(sectionId: string) {
    const root = this.getScrollRoot();
    // A fixed envelope can still have client rects while translated away. Do
    // not let it claim the active state after the invitation has been opened.
    if (sectionId === this.options.openingSectionId && root?.dataset.opened === "true") return null;
    return document.querySelector<HTMLElement>(`[data-template-section="${CSS.escape(sectionId)}"]`);
  }

  getSectionEntries(): TemplateSectionEntry[] {
    return this.options.sectionIds.flatMap((id) => {
      const element = this.getSectionElement(id);
      if (!element || element.hasAttribute("hidden") || element.classList.contains("is-hidden")) return [];
      if (getComputedStyle(element).display === "none") return [];
      return [{ id, element }];
    });
  }

  prepareSection(sectionId: string) {
    window.dispatchEvent(new CustomEvent(this.options.prepareEvent, { detail: { sectionType: sectionId } }));
    // React must commit the opened/closed state before the navigation manager
    // measures target geometry.
    return new Promise<void>((resolve) =>
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
    );
  }

  isSectionReady(sectionId: string) {
    if (sectionId === this.options.openingSectionId) return Boolean(this.getSectionElement(sectionId));
    const root = this.getScrollRoot();
    return Boolean(root?.dataset.opened === "true" && root.scrollHeight > root.clientHeight);
  }

  getOpeningSectionId() {
    return this.options.openingSectionId ?? null;
  }
}
