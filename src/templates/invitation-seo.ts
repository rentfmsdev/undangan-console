import type { TemplateKit } from "./contracts";

type SeoSection = { type: string; enabled: boolean; data: Record<string, unknown> };

function text(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function firstText(sections: SeoSection[], keys: string[]) {
  for (const section of sections) {
    if (!section.enabled) continue;
    for (const key of keys) {
      const value = text(section.data[key]);
      if (value) return value;
    }
  }
  return "";
}

function firstImage(sections: SeoSection[]) {
  for (const section of sections) {
    if (!section.enabled) continue;
    const single = text(section.data.imageUrl) || text(section.data.backgroundImageUrl);
    if (single) return single;
    if (Array.isArray(section.data.imageUrls)) {
      const galleryImage = section.data.imageUrls.find((item): item is string => typeof item === "string" && Boolean(item.trim()));
      if (galleryImage) return galleryImage;
    }
  }
  return "/assets/fav.png";
}

export function buildInvitationSeo(
  template: TemplateKit,
  sections: SeoSection[],
  canonicalUrl: string,
  guestName?: string
) {
  const categoryLabels: Record<string, string> = {
    wedding: "Undangan Pernikahan",
    birthday: "Undangan Ulang Tahun",
    aqiqah: "Undangan Tasyakuran Walimatul Aqiqah",
    khitanan: "Undangan Walimatul Khitan",
  };
  const categoryLabel = categoryLabels[template.category] || "Undangan Digital";

  // 1. Resolve host / celebrant / couple / subject
  let titleSubject = "";
  if (template.category === "wedding") {
    const couple = firstText(sections.filter((s) => s.type === "mempelai" || s.type === "couple"), ["title", "couple", "brideName", "groomName"]);
    titleSubject = couple;
  } else if (template.category === "birthday") {
    const heroTitle = firstText(sections.filter((s) => s.type === "hero"), ["title"]);
    const envelopeTitle = firstText(sections.filter((s) => s.type === "opening-envelope"), ["title"]);
    titleSubject = envelopeTitle || heroTitle;
  } else if (template.category === "aqiqah") {
    const childName = firstText(sections.filter((s) => s.type === "profile" || s.type === "hero"), ["name", "babyName", "title"]);
    const envelopeTitle = firstText(sections.filter((s) => s.type === "opening-envelope"), ["title"]);
    titleSubject = childName || envelopeTitle;
  } else if (template.category === "khitanan") {
    const childName = firstText(sections.filter((s) => s.type === "profile" || s.type === "hero"), ["childName", "name", "title"]);
    const envelopeTitle = firstText(sections.filter((s) => s.type === "opening-envelope"), ["title"]);
    titleSubject = childName || envelopeTitle;
  }

  if (!titleSubject) {
    const heroTitle = firstText(sections.filter((s) => s.type === "hero" || s.type === "opening-envelope"), ["title"]);
    titleSubject = heroTitle || template.name;
  }

  const cleanGuest = guestName ? guestName.trim().replace(/\s+/g, " ") : "";

  // 2. Build Title with Guest Name if present
  let title = "";
  if (cleanGuest) {
    title = `${categoryLabel} ${titleSubject} - Khusus untuk ${cleanGuest} | Undangan Studio`;
  } else {
    title = `${categoryLabel} ${titleSubject} | Undangan Studio`;
  }

  const eventDate = firstText(sections, ["date", "subtitle", "eventDate"]);
  const location = firstText(sections.filter((s) => s.type === "event" || s.type === "location"), ["address", "venue", "subtitle"]);

  // 3. Build rich Description
  let description = "";
  if (cleanGuest) {
    description = `Kepada Yth. ${cleanGuest}, Anda diundang menghadiri ${categoryLabel} ${titleSubject}.${eventDate ? ` Acara diselenggarakan pada ${eventDate}.` : ""}${location ? ` Bertempat di ${location}.` : ""} Buka undangan resmi ini untuk melihat detail lengkap acara dan konfirmasi kehadiran.`;
  } else {
    description = `${categoryLabel} ${titleSubject}.${eventDate ? ` Acara diselenggarakan pada ${eventDate}.` : ""}${location ? ` Bertempat di ${location}.` : ""} Buka undangan digital resmi untuk melihat susunan acara, lokasi, galeri, dan konfirmasi kehadiran.`;
  }
  description = description.slice(0, 320);

  const image = firstImage(sections);
  const absoluteImage = image.startsWith("http") ? image : new URL(image, canonicalUrl).toString();
  return {
    title,
    description,
    image: absoluteImage,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Event",
      name: cleanGuest ? `${categoryLabel} ${titleSubject} (untuk ${cleanGuest})` : `${categoryLabel} ${titleSubject}`,
      description,
      url: canonicalUrl,
      image: absoluteImage,
      location: location ? { "@type": "Place", name: location } : undefined,
      organizer: { "@type": "Organization", name: "Undangan Studio" },
    },
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
