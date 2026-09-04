import rawTemplates from "./templates.json";
import { validateTemplateCatalog } from "./schema";
import type { TemplateCatalogItem, TemplateKit } from "./contracts";
import { weddingLampungElegance } from "./wedding-lampung-elegance/manifest";
import { birthdayCelestial } from "./birthday-celestial/manifest";
import { khitanKsatriaJawa } from "./khitan-ksatria-jawa/manifest";

/**
 * Daftar template catalog marketplace yang dibaca dari file standar templates.json.
 * Untuk menambah template baru, cukup tambahkan objek baru ke dalam array src/templates/templates.json.
 */
export const templatesCatalog: TemplateCatalogItem[] = validateTemplateCatalog(rawTemplates);

/**
 * Registry manifest lengkap (TemplateKit) untuk engine visual editor & builder.
 */
export const templateRegistry: TemplateKit[] = [weddingLampungElegance, birthdayCelestial, khitanKsatriaJawa];

export function getTemplateCatalogItem(codeOrId: string): TemplateCatalogItem | undefined {
  const normalized = codeOrId.toLowerCase();
  return templatesCatalog.find((item) => item.code.toLowerCase() === normalized || item.id.toLowerCase() === normalized);
}

export function getTemplateByCode(code: string): TemplateKit | undefined {
  return templateRegistry.find((template) => template.code.toLowerCase() === code.toLowerCase());
}

export function getTemplateById(id: string): TemplateKit | undefined {
  return templateRegistry.find((template) => template.id === id);
}

export function getTemplateByCodeOrId(codeOrId: string): TemplateKit | undefined {
  const normalized = codeOrId.toLowerCase();
  return templateRegistry.find(
    (template) =>
      template.code.toLowerCase() === normalized ||
      template.id.toLowerCase() === normalized ||
      (template.id === "wedding-lampung-elegance" && (normalized === "wedding-elegance" || normalized === "wedding_elegance"))
  );
}
