import type { TemplateKit } from "@/templates/contracts";
import { normalizeCardStyle, type CardStyleSettings } from "./contracts";

type ShareSection = {
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

type ShareColors = {
  background: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
  dark: string;
  rich: string;
  cream: string;
  muted: string;
};

export type InvitationShareData = {
  templateId: string;
  templateCode: string;
  category: TemplateKit["category"];
  categoryLabel: string;
  subject: string;
  guestName: string;
  eventDate: string;
  primaryTime: string;
  secondaryTime: string;
  venue: string;
  address: string;
  colors: ShareColors;
  displayFont: string;
  cardStyle: CardStyleSettings;
};

const CATEGORY_LABELS: Record<TemplateKit["category"], string> = {
  wedding: "Undangan Pernikahan",
  birthday: "Undangan Ulang Tahun",
  aqiqah: "Undangan Aqiqah",
  khitanan: "Undangan Khitanan",
  wisuda: "Undangan Wisuda",
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function firstText(sections: ShareSection[], keys: string[]) {
  for (const section of sections) {
    if (!section.enabled) continue;
    for (const key of keys) {
      const value = cleanText(section.data[key]);
      if (value) return value;
    }
  }
  return "";
}

function firstSection(sections: ShareSection[], types: string[]) {
  return sections.find((section) => section.enabled && types.includes(section.type));
}

function sectionText(section: ShareSection | undefined, keys: string[]) {
  if (!section) return "";
  for (const key of keys) {
    const value = cleanText(section.data[key]);
    if (value) return value;
  }
  return "";
}

function resolveSubject(template: TemplateKit, sections: ShareSection[]) {
  const opening = firstSection(sections, ["opening-envelope", "opening"]);
  const hero = firstSection(sections, ["hero"]);
  const couple = firstSection(sections, ["couple", "mempelai"]);
  const profile = firstSection(sections, ["profile", "about"]);

  if (template.category === "wedding") {
    const envelopeTitle = sectionText(opening, ["title"]);
    if (envelopeTitle) return envelopeTitle;
    const bride = sectionText(couple, ["brideName"]);
    const groom = sectionText(couple, ["groomName"]);
    if (bride && groom) return `${bride} & ${groom}`;
    return sectionText(couple, ["title", "couple"]) || sectionText(hero, ["title"]);
  }

  if (template.category === "wisuda") {
    return sectionText(hero, ["graduateName"]) || sectionText(profile, ["graduateName"]) || sectionText(opening, ["graduateName", "title"]);
  }

  if (template.category === "khitanan") {
    return sectionText(hero, ["childName", "name", "title", "subtitle"]) || sectionText(profile, ["childName", "name", "title"]);
  }

  if (template.category === "aqiqah") {
    return sectionText(hero, ["babyName", "name", "nickname", "title", "subtitle"]) || sectionText(profile, ["babyName", "name", "nickname", "title"]);
  }

  return sectionText(opening, ["title"]) || sectionText(hero, ["title", "name", "subtitle"]);
}

function resolveDate(template: TemplateKit, sections: ShareSection[]) {
  const event = firstSection(sections, ["event", "events", "schedule", "ceremony"]);
  if (template.id === "wedding-lampung-elegance" && event) {
    const day = sectionText(event, ["day"]);
    const date = sectionText(event, ["date"]);
    const monthYear = sectionText(event, ["monthYear"]);
    const combined = day && date && monthYear
      ? `${day}, ${date} ${monthYear}`
      : [day, date, monthYear].filter(Boolean).join(" ");
    if (combined) return combined;
  }
  return sectionText(event, ["eventDate", "date", "subtitle"])
    || firstText(sections, ["eventDate", "date"])
    || sectionText(firstSection(sections, ["hero"]), ["date", "subtitle"])
    || sectionText(firstSection(sections, ["opening-envelope", "opening"]), ["date", "subtitle"]);
}

function resolveColors(template: TemplateKit, themeId: string, styleOverrides: Record<string, unknown>) {
  const theme = template.themes.find((item) => item.id === themeId) ?? template.themes[0];
  const colors = theme.colors;
  const customColors = (styleOverrides.customColors ?? styleOverrides.colors) as Partial<ShareColors> | undefined;
  return {
    background: customColors?.background || colors.background,
    surface: customColors?.surface || colors.surface,
    primary: customColors?.primary || colors.primary,
    accent: customColors?.accent || colors.accent,
    text: customColors?.text || colors.text,
    dark: customColors?.dark || colors.dark,
    rich: customColors?.rich || colors.rich,
    cream: customColors?.cream || colors.cream,
    muted: customColors?.muted || colors.muted,
  };
}

export function buildInvitationShareData({
  template,
  sections,
  themeId,
  styleOverrides = {},
  guestName,
}: {
  template: TemplateKit;
  sections: ShareSection[];
  themeId: string;
  styleOverrides?: Record<string, unknown>;
  guestName?: string;
}): InvitationShareData {
  const event = firstSection(sections, ["event", "events", "schedule", "ceremony"]);
  const location = firstSection(sections, ["location", "map", "venue", "unduh-mantu"]);
  const resolvedGuest = cleanText(guestName) || "Bapak/Ibu/Saudara/i";

  return {
    templateId: template.id,
    templateCode: template.code,
    category: template.category,
    categoryLabel: CATEGORY_LABELS[template.category] || "Undangan Digital",
    subject: resolveSubject(template, sections) || template.name,
    guestName: resolvedGuest,
    eventDate: resolveDate(template, sections),
    primaryTime: sectionText(event, ["akadTime", "ceremonyTime", "eventTime", "time", "subtitle"]),
    secondaryTime: sectionText(event, ["receptionTime"]),
    venue: sectionText(event, ["venue", "venueName", "locationName", "ceremonyVenue"])
      || sectionText(location, ["venue", "venueName", "locationName", "title"]),
    address: sectionText(event, ["address", "venueAddress"])
      || sectionText(location, ["address", "venueAddress", "subtitle"]),
    colors: resolveColors(template, themeId, styleOverrides),
    displayFont: (template.themes.find((item) => item.id === themeId) ?? template.themes[0]).fonts.display,
    cardStyle: normalizeCardStyle(styleOverrides.cardStyle),
  };
}
