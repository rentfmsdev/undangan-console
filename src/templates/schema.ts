import { z } from "zod";
import type { TemplateKit } from "./contracts";

const editorFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  control: z.enum(["text", "textarea", "url", "datetime-local"]),
  rows: z.number().int().positive().optional(),
});

export const templateKitSchema = z.object({
  id: z.string().min(1),
  code: z.string().length(5),
  version: z.number().int().positive(),
  category: z.enum(["wedding", "birthday", "khitanan", "aqiqah"]),
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().int().nonnegative().optional(),
  defaultMusicUrl: z.string().optional(),
  themes: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    colors: z.object({ background: z.string(), surface: z.string(), primary: z.string(), accent: z.string(), text: z.string(), dark: z.string(), rich: z.string(), mid: z.string(), cream: z.string(), border: z.string(), muted: z.string() }),
    fonts: z.object({ display: z.string(), heading: z.string(), body: z.string() }),
  })).min(1),
  sections: z.array(z.object({
    type: z.string().min(1),
    label: z.string().min(1),
    description: z.string(),
    required: z.boolean(),
    reorderable: z.boolean(),
    maxInstances: z.number().int().positive(),
    fields: z.array(editorFieldSchema).optional(),
    capabilities: z.object({ backgroundColor: z.boolean().optional(), backgroundImage: z.boolean().optional(), image: z.boolean().optional(), gallery: z.boolean().optional(), map: z.boolean().optional(), textStyle: z.boolean().optional() }).optional(),
    defaultData: z.object({ title: z.string() }).passthrough(),
  })).min(1),
  defaultSections: z.array(z.string().min(1)).min(1),
  navigation: z.object({
    scrollRootSelector: z.string().min(1),
    sectionAttribute: z.string().min(1),
    openingSectionId: z.string().nullable(),
  }),
  defaultView: z.enum(["mobile", "desktop"]).optional(),
  useContainer: z.boolean().optional(),
}).superRefine((template, context) => {
  const sectionTypes = new Set(template.sections.map((section) => section.type));
  for (const type of template.defaultSections) {
    if (!sectionTypes.has(type)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["defaultSections"], message: `Section default '${type}' tidak terdaftar.` });
  }
  if (template.navigation.openingSectionId && !sectionTypes.has(template.navigation.openingSectionId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["navigation", "openingSectionId"], message: "Opening section tidak terdaftar." });
  }
});

export function defineTemplate(template: TemplateKit): TemplateKit {
  return templateKitSchema.parse(template) as TemplateKit;
}

export const templateCatalogItemSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  categoryLabel: z.string().min(1),
  description: z.string().min(1),
  price: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  favoriteCount: z.number().int().nonnegative(),
  releaseDate: z.string().min(1),
  status: z.enum(["available", "coming-soon"]),
  covers: z.array(z.string().min(1)).min(1),
  themeColors: z.array(z.string()).min(1),
  features: z.array(z.string()).min(1),
  tags: z.array(z.string()).optional(),
  defaultView: z.enum(["mobile", "desktop"]).optional(),
  useContainer: z.boolean().optional(),
});

export const templateCatalogListSchema = z.array(templateCatalogItemSchema);

export function validateTemplateCatalog(data: unknown) {
  return templateCatalogListSchema.parse(data);
}
