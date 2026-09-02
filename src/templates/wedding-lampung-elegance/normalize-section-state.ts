import type { TemplateKit } from "../contracts";
import type { WeddingPreviewSection } from "./source/template-bridge";

type StoredSection = {
  id: string;
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

const legacyDefaults: Record<string, { title?: string[]; subtitle?: string[] }> = {
  "opening-envelope": { subtitle: ["Klik segel untuk membuka"] },
  couple: { title: ["Dwi Wahyulita & Ardi Mahendra"], subtitle: ["Dengan memohon rahmat dan rida Allah SWT"] },
  event: { subtitle: ["Sabtu, 26 September 2026"] },
  gallery: { subtitle: ["Kenangan Ayu & Ardi"] },
  quote: { title: ["Dan di antara tanda-tanda kekuasaan-Nya"], subtitle: ["Ar-Rum: 21"] },
  map: { title: ["Lokasi Acara"], subtitle: ["Dusun Srimenanti, Pesawaran, Lampung"] },
  gift: { title: ["Tanda Kasih"], subtitle: ["Doa restu Anda adalah hadiah terindah"] },
  wishes: { subtitle: ["Kirim doa terbaik Anda"] },
};

export function normalizeWeddingSectionState(template: TemplateKit, records: StoredSection[], createId: (type: string) => string) {
  const requiresLayoutMigration = !records.some((record) => record.type === "countdown") || !records.some((record) => record.type === "map");
  const normalized: WeddingPreviewSection[] = records.flatMap((record) => {
    const definition = template.sections.find((section) => section.type === record.type);
    if (!definition) return [];
    const data = { ...definition.defaultData, ...record.data };
    const legacy = legacyDefaults[record.type];
    if (legacy?.title?.includes(String(record.data.title ?? ""))) data.title = definition.defaultData.title;
    if (legacy?.subtitle?.includes(String(record.data.subtitle ?? ""))) data.subtitle = definition.defaultData.subtitle;
    return [{ id: record.id, type: record.type, enabled: record.enabled, data }];
  });

  for (const [defaultIndex, type] of template.defaultSections.entries()) {
    if (normalized.some((section) => section.type === type)) continue;
    const definition = template.sections.find((section) => section.type === type);
    if (!definition) continue;
    const nextDefaultType = template.defaultSections.slice(defaultIndex + 1).find((candidate) => normalized.some((section) => section.type === candidate));
    const insertAt = nextDefaultType ? normalized.findIndex((section) => section.type === nextDefaultType) : normalized.length;
    normalized.splice(insertAt, 0, { id: createId(type), type, enabled: true, data: { ...definition.defaultData } });
  }

  if (requiresLayoutMigration) {
    normalized.sort((left, right) => {
      const leftOrder = template.defaultSections.indexOf(left.type);
      const rightOrder = template.defaultSections.indexOf(right.type);
      return (leftOrder < 0 ? Number.MAX_SAFE_INTEGER : leftOrder) - (rightOrder < 0 ? Number.MAX_SAFE_INTEGER : rightOrder);
    });
  }

  return normalized;
}
