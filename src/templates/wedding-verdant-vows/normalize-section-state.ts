import type { TemplateKit } from "../contracts";

export function normalizeVerdantVowsSectionState(
  template: TemplateKit,
  records: Array<{
    id: string;
    type: string;
    enabled: boolean;
    data: Record<string, unknown>;
  }>,
  createId: (type: string) => string,
) {
  const known = records
    .filter((record) =>
      template.sections.some((section) => section.type === record.type),
    )
    .map((record) => ({
      ...record,
      data: {
        ...(template.sections.find((section) => section.type === record.type)
          ?.defaultData ?? {}),
        ...record.data,
      },
    }));

  for (const [defaultIndex, type] of template.defaultSections.entries()) {
    if (known.some((section) => section.type === type)) continue;
    const definition = template.sections.find(
      (section) => section.type === type,
    );
    if (!definition) continue;
    const nextKnownType = template.defaultSections
      .slice(defaultIndex + 1)
      .find((nextType) => known.some((section) => section.type === nextType));
    const insertAt = nextKnownType
      ? known.findIndex((section) => section.type === nextKnownType)
      : -1;
    const created = {
      id: createId(type),
      type,
      enabled: true,
      data: { ...definition.defaultData },
    };
    if (insertAt >= 0) known.splice(insertAt, 0, created);
    else known.push(created);
  }

  // Version awal menambahkan "story" di akhir draft lama. Perbaiki hanya
  // bentuk migrasi tersebut, tanpa menimpa urutan yang sengaja diubah pengguna.
  const storyIndex = known.findIndex((section) => section.type === "story");
  const closingIndex = known.findIndex((section) => section.type === "closing");
  const galleryIndex = known.findIndex((section) => section.type === "gallery");
  if (
    storyIndex >= 0 &&
    closingIndex >= 0 &&
    storyIndex > closingIndex &&
    galleryIndex >= 0
  ) {
    const [story] = known.splice(storyIndex, 1);
    const insertBeforeGallery = known.findIndex(
      (section) => section.type === "gallery",
    );
    known.splice(
      insertBeforeGallery >= 0 ? insertBeforeGallery : known.length,
      0,
      story,
    );
  }

  // Draft awal memakai copy "Our Story" untuk section mempelai, padahal
  // perjalanan pasangan sekarang memiliki section timeline tersendiri.
  // Migrasi hanya menyentuh copy bawaan lama, tidak pernah teks yang sudah
  // dipersonalisasi pengguna.
  const couple = known.find((section) => section.type === "couple");
  if (couple) {
    if (
      typeof couple.data.eyebrow === "string" &&
      couple.data.eyebrow.trim().toLowerCase() === "our story"
    )
      couple.data.eyebrow = "Mempelai";
    if (couple.data.title === "Dua hati, satu arah")
      couple.data.title = "Perkenalkan mempelai";
    if (
      couple.data.intro ===
      "Dengan penuh rasa syukur, kami mengundang Anda untuk menjadi bagian dari awal perjalanan kami."
    )
      couple.data.intro =
        "Kami memperkenalkan dua pribadi yang akan memulai perjalanan baru bersama.";
  }

  return known;
}
