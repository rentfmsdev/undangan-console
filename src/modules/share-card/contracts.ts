export type CardStyleSettings = {
  styleId: "template" | "elegant" | "minimal";
  imageUrl?: string;
  backgroundMode: "template" | "photo" | "solid";
  overlayOpacity: number;
  textAlign: "left" | "center";
  colors?: {
    background?: string;
    primary?: string;
    accent?: string;
    text?: string;
  };
  showGuestName: boolean;
  showDate: boolean;
  showVenue: boolean;
  showSubject: boolean;
  version: number;
};

export const DEFAULT_CARD_STYLE: CardStyleSettings = {
  styleId: "template",
  backgroundMode: "template",
  overlayOpacity: 0.58,
  textAlign: "center",
  showGuestName: true,
  showDate: false,
  showVenue: false,
  showSubject: true,
  version: 1,
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function color(value: unknown) {
  const candidate = text(value);
  return /^#[0-9a-f]{3,8}$/i.test(candidate) ? candidate : undefined;
}

export function normalizeCardStyle(value: unknown): CardStyleSettings {
  const candidate = value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
  const colorsSource = candidate.colors && typeof candidate.colors === "object"
    ? (candidate.colors as Record<string, unknown>)
    : {};
  const styleId = candidate.styleId;
  const backgroundMode = candidate.backgroundMode;
  const textAlign = candidate.textAlign;
  const overlayOpacity = Number(candidate.overlayOpacity);
  const version = Number(candidate.version);

  return {
    styleId: styleId === "elegant" || styleId === "minimal" ? styleId : "template",
    imageUrl: text(candidate.imageUrl) || undefined,
    backgroundMode: backgroundMode === "photo" || backgroundMode === "solid" ? backgroundMode : "template",
    overlayOpacity: Number.isFinite(overlayOpacity)
      ? Math.min(0.9, Math.max(0.2, overlayOpacity))
      : DEFAULT_CARD_STYLE.overlayOpacity,
    textAlign: textAlign === "left" ? "left" : "center",
    colors: {
      background: color(colorsSource.background),
      primary: color(colorsSource.primary),
      accent: color(colorsSource.accent),
      text: color(colorsSource.text),
    },
    showGuestName: candidate.showGuestName !== false,
    showDate: candidate.showDate === true,
    showVenue: candidate.showVenue === true,
    showSubject: candidate.showSubject !== false,
    version: Number.isFinite(version) && version > 0 ? Math.floor(version) : DEFAULT_CARD_STYLE.version,
  };
}
