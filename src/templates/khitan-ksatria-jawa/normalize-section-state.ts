import type { TemplateKit } from "../contracts";

export function normalizeKhitanSectionState(
  template: TemplateKit,
  records: Array<{ id: string; type: string; enabled: boolean; data: Record<string, unknown> }>,
  createId: (type: string) => string
) {
  const known = records
    .filter((record) => template.sections.some((section) => section.type === record.type))
    .map((record) => {
      const defaultData = template.sections.find((section) => section.type === record.type)?.defaultData ?? {};
      const mergedData: Record<string, unknown> = {
        ...defaultData,
        ...record.data,
      };
      if (record.type === "profile" && mergedData.imageUrl === "/assets/khitanan/2.jpeg") {
        mergedData.imageUrl = "/assets/khitanan/7.jpeg";
      }
      if (record.type === "event") {
        delete mergedData.event2Title;
        delete mergedData.event2Time;
        if (!mergedData.eventTitle && mergedData.event1Title) {
          mergedData.eventTitle = mergedData.event1Title;
        }
        if (!mergedData.eventTime && mergedData.event1Time) {
          mergedData.eventTime = mergedData.event1Time;
        }
        delete mergedData.event1Title;
        delete mergedData.event1Time;
      }
      return {
        ...record,
        data: mergedData,
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
