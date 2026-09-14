import type { TemplateKit } from "./contracts";
import { buildInvitationShareData } from "@/modules/share-card/invitation-share-data";

type SeoSection = { type: string; enabled: boolean; data: Record<string, unknown> };

function text(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
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
  guestName?: string,
  themeId?: string,
  styleOverrides?: Record<string, unknown>
) {
  const share = buildInvitationShareData({
    template,
    sections,
    themeId: themeId || template.themes[0]?.id || "",
    styleOverrides,
    guestName,
  });
  const cleanGuest = guestName ? guestName.trim().replace(/\s+/g, " ") : "";
  const location = share.venue || share.address;
  const title = cleanGuest
    ? `${share.categoryLabel} ${share.subject} - Khusus untuk ${cleanGuest} | Undangan Studio`
    : `${share.categoryLabel} ${share.subject} | Undangan Studio`;
  let description = cleanGuest
    ? `Kepada Yth. ${cleanGuest}, Anda diundang menghadiri ${share.categoryLabel} ${share.subject}.`
    : `${share.categoryLabel} ${share.subject}.`;
  if (share.eventDate) description += ` Acara diselenggarakan pada ${share.eventDate}.`;
  if (location) description += ` Bertempat di ${location}.`;
  description += " Buka undangan resmi ini untuk melihat detail lengkap acara dan konfirmasi kehadiran.";
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
      name: cleanGuest ? `${share.categoryLabel} ${share.subject} (untuk ${cleanGuest})` : `${share.categoryLabel} ${share.subject}`,
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
