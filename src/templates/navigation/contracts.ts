export type TemplateSectionEntry = { id: string; element: HTMLElement };

export interface TemplateNavigationAdapter {
  getScrollRoot(): HTMLElement | null;
  getSectionElement(sectionId: string): HTMLElement | null;
  getSectionEntries(): TemplateSectionEntry[];
  prepareSection(sectionId: string): void | Promise<void>;
  isSectionReady(sectionId: string): boolean;
  getOpeningSectionId(): string | null;
}
