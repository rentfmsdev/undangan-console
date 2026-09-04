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

export function buildInvitationSeo(template: TemplateKit, sections: SeoSection[], canonicalUrl: string) {
  const categoryLabel = template.category === "wedding" ? "Undangan Pernikahan" : template.category === "birthday" ? "Undangan Ulang Tahun" : "Undangan Digital";
  const couple = firstText(sections.filter((section) => section.type === "mempelai" || section.type === "couple"), ["title", "brideName", "groomName"]);
  const heroTitle = firstText(sections.filter((section) => section.type === "hero" || section.type === "opening-envelope"), ["title"]);
  const titleSubject = couple || heroTitle || template.name;
  const eventDate = firstText(sections, ["date", "subtitle"]);
  const location = firstText(sections.filter((section) => section.type === "event" || section.type === "location"), ["address", "subtitle"]);
  const title = `${categoryLabel} ${titleSubject} | Undangan Studio`;
  const descriptionParts = [`${categoryLabel} ${titleSubject}.`];
  if (eventDate) descriptionParts.push(eventDate);
  if (location) descriptionParts.push(location);
  descriptionParts.push("Buka undangan untuk melihat detail acara.");
  const description = descriptionParts.join(" ").slice(0, 300);
  const image = firstImage(sections);
  const absoluteImage = image.startsWith("http") ? image : new URL(image, canonicalUrl).toString();
  return {
    title,
    description,
    image: absoluteImage,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Event",
      name: `${categoryLabel} ${titleSubject}`,
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
