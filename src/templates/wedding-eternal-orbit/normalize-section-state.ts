import type { TemplateKit } from "../contracts";

type SectionRecord = {
  id: string;
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

export function normalizeEternalOrbitSectionState(
  template: TemplateKit,
  records: SectionRecord[],
  createId: (type: string) => string,
) {
  const known = records
    .filter((record) => template.sections.some((section) => section.type === record.type))
    .map((record) => {
      const definition = template.sections.find((section) => section.type === record.type);
      return { ...record, data: { ...(definition?.defaultData ?? {}), ...record.data } };
    });

  for (const [index, type] of template.defaultSections.entries()) {
    if (known.some((section) => section.type === type)) continue;
    const definition = template.sections.find((section) => section.type === type);
    if (!definition) continue;
    const nextType = template.defaultSections.slice(index + 1).find((candidate) => known.some((section) => section.type === candidate));
    const insertAt = nextType ? known.findIndex((section) => section.type === nextType) : -1;
    const next = { id: createId(type), type, enabled: true, data: { ...definition.defaultData } };
    if (insertAt >= 0) known.splice(insertAt, 0, next);
    else known.push(next);
  }

  return known;
}
