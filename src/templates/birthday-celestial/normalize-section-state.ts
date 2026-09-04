import type { TemplateKit } from "../contracts";

export function normalizeBirthdaySectionState(
  template: TemplateKit,
  records: Array<{ id: string; type: string; enabled: boolean; data: Record<string, unknown> }>,
  createId: (type: string) => string
) {
  const known = records
    .filter((record) => template.sections.some((section) => section.type === record.type))
    .map((record) => {
      const defaultData = template.sections.find((section) => section.type === record.type)?.defaultData ?? {};
      return {
        ...record,
        data: {
          ...defaultData,
          ...record.data,
        },
      };
    });
  for (const type of template.defaultSections) {
    if (!known.some((section) => section.type === type)) {
      known.push({
        id: createId(type),
        type,
        enabled: true,
        data: { ...template.sections.find((section) => section.type === type)!.defaultData },
      });
    }
  }
  return known;
}
