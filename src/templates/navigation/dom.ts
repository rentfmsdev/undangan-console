export function findTemplateSection(root: ParentNode, sectionId: string) {
  return Array.from(
    root.querySelectorAll<HTMLElement>("[data-template-section]"),
  ).find((element) => element.dataset.templateSection === sectionId) ?? null;
}
