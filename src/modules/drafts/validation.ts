import { z } from "zod";
import { getTemplateById } from "@/templates/registry";

export const createDraftSchema = z.object({
  templateCode: z.string().regex(/^[a-z0-9]{5}$/),
  title: z.string().trim().min(1).max(120).optional(),
});

export const updateDraftSchema = z.object({
  themeId: z.string().min(1),
  settings: z.object({
    musicUrl: z.string().max(1024).optional(),
    musicVolume: z.number().min(0).max(1).optional(),
    customColors: z.object({
      primary: z.string().max(32).optional(),
      accent: z.string().max(32).optional(),
      background: z.string().max(32).optional(),
    }).optional(),
  }).optional(),
  sections: z.array(z.object({
    id: z.string().uuid(),
    type: z.string().min(1),
    order: z.number().int().nonnegative(),
    enabled: z.boolean(),
    data: z.record(z.string(), z.unknown()),
  })).min(1),
});

export function validateDraftForTemplate(templateId: string, input: z.infer<typeof updateDraftSchema>) {
  const template = getTemplateById(templateId);
  if (!template) return "Template tidak ditemukan.";
  if (!template.themes.some((theme) => theme.id === input.themeId)) return "Theme tidak tersedia untuk template ini.";

  const counts = new Map<string, number>();
  for (const section of input.sections) {
    const definition = template.sections.find((item) => item.type === section.type);
    if (!definition) return `Section ${section.type} tidak tersedia untuk template ini.`;
    counts.set(section.type, (counts.get(section.type) ?? 0) + 1);
    if ((counts.get(section.type) ?? 0) > definition.maxInstances) return `Batas section ${definition.label} terlampaui.`;
  }

  for (const definition of template.sections.filter((section) => section.required)) {
    const section = input.sections.find((item) => item.type === definition.type);
    if (!section?.enabled) return `Section wajib ${definition.label} harus aktif.`;
  }

  return null;
}
