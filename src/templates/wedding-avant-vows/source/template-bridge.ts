import { findTemplateSection } from "@/templates/navigation/dom";

export type AvantVowsPreviewSection = {
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

export type AvantVowsSettings = {
  customColors?: { primary?: string; accent?: string; background?: string };
  musicUrl?: string;
  musicVolume?: number;
  useContainer?: boolean;
};

type TextStyle = { fontFamily?: string; fontSize?: number; color?: string; bold?: boolean; italic?: boolean };

const palettes: Record<string, Record<string, string>> = {
  "ink-vermilion": { "--av-bg":"#f3eadb", "--av-surface":"#fffaf0", "--av-primary":"#ed4b32", "--av-accent":"#f3b82f", "--av-text":"#151515", "--av-dark":"#111111", "--av-rich":"#2b2926", "--av-mid":"#8a8175", "--av-cream":"#f3eadb", "--av-border":"#151515", "--av-muted":"#716b63" },
  "cobalt-butter": { "--av-bg":"#f6e9a9", "--av-surface":"#fff8d5", "--av-primary":"#1648d8", "--av-accent":"#ff6a3d", "--av-text":"#10245d", "--av-dark":"#071b50", "--av-rich":"#183986", "--av-mid":"#6982c1", "--av-cream":"#f6e9a9", "--av-border":"#1648d8", "--av-muted":"#5c6790" },
  "plum-mint": { "--av-bg":"#dff3df", "--av-surface":"#f4fff2", "--av-primary":"#7d245f", "--av-accent":"#dd5c76", "--av-text":"#321d32", "--av-dark":"#271027", "--av-rich":"#5b1e4b", "--av-mid":"#9d7292", "--av-cream":"#dff3df", "--av-border":"#7d245f", "--av-muted":"#746273" },
  "espresso-blush": { "--av-bg":"#f2d8d1", "--av-surface":"#fff2ed", "--av-primary":"#6f3d2e", "--av-accent":"#d55e60", "--av-text":"#3b211c", "--av-dark":"#281510", "--av-rich":"#573126", "--av-mid":"#a77b70", "--av-cream":"#f2d8d1", "--av-border":"#6f3d2e", "--av-muted":"#806861" },
};

const fonts: Record<string, string> = {
  template: "",
  "great-vibes": "var(--font-great-vibes), cursive",
  "dancing-script": "var(--font-dancing-script), cursive",
  cormorant: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
  manrope: "var(--font-manrope), Manrope, sans-serif",
};

const themeDisplayFonts: Record<string, string> = {
  "ink-vermilion": "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
  "cobalt-butter": "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
  "plum-mint": "var(--font-great-vibes), 'Great Vibes', cursive",
  "espresso-blush": "var(--font-dancing-script), 'Dancing Script', cursive",
};

function setTextStyles(node: HTMLElement, styles?: Record<string, TextStyle>) {
  node.querySelectorAll<HTMLElement>("[data-field]").forEach((target) => {
    const style = styles?.[target.dataset.field ?? ""];
    ["font-family", "font-size", "color", "font-weight", "font-style"].forEach((property) => target.style.removeProperty(property));
    if (!style) return;
    if (style.fontFamily && fonts[style.fontFamily]) target.style.fontFamily = fonts[style.fontFamily];
    if (typeof style.fontSize === "number") target.style.fontSize = `${style.fontSize}px`;
    if (style.color) target.style.color = style.color;
    if (typeof style.bold === "boolean") target.style.fontWeight = style.bold ? "700" : "400";
    if (typeof style.italic === "boolean") target.style.fontStyle = style.italic ? "italic" : "normal";
  });
}

function setPhotoSlots(node: HTMLElement, data: Record<string, unknown>) {
  const images = node.querySelectorAll<HTMLImageElement>("[data-image]");
  if (Array.isArray(data.imageUrls)) {
    const urls = data.imageUrls as unknown[];
    images.forEach((image, index) => {
      const value = urls[index];
      if (typeof value === "string" && value.trim()) image.setAttribute("src", value.trim());
      else image.removeAttribute("src");
    });
    return urls.filter((value): value is string => typeof value === "string" && Boolean(value.trim())).slice(0, 4);
  }
  if (Object.prototype.hasOwnProperty.call(data, "imageUrl")) {
    const value = typeof data.imageUrl === "string" ? data.imageUrl.trim() : "";
    images.forEach((image) => value ? image.setAttribute("src", value) : image.removeAttribute("src"));
  }
  return null;
}

function applyAudio(shell: HTMLElement, settings: AvantVowsSettings) {
  const audio = shell.querySelector<HTMLAudioElement>("audio");
  const source = audio?.querySelector<HTMLSourceElement>("source");
  if (!audio || !source) return;
  if (typeof settings.musicVolume === "number") audio.volume = Math.max(0, Math.min(1, settings.musicVolume));
  if (typeof settings.musicUrl !== "string") return;
  const next = settings.musicUrl.trim();
  const current = source.getAttribute("src") ?? "";
  if (current === next) return;
  audio.pause();
  if (next) source.setAttribute("src", next);
  else source.removeAttribute("src");
  audio.load();
}

export function applyAvantVowsTemplateState(
  sections: AvantVowsPreviewSection[],
  themeId = "ink-vermilion",
  settings: AvantVowsSettings = {},
) {
  if (typeof document === "undefined") return;
  const shell = document.querySelector<HTMLElement>(".avant-shell");
  if (!shell) return;

  shell.dataset.useContainer = settings.useContainer === false ? "false" : "true";
  Object.entries(palettes[themeId] ?? palettes["ink-vermilion"]).forEach(([key, value]) => shell.style.setProperty(key, value));
  shell.style.setProperty("--av-display", themeDisplayFonts[themeId] ?? themeDisplayFonts["ink-vermilion"]);
  if (settings.customColors?.primary) {
    shell.style.setProperty("--av-primary", settings.customColors.primary);
    shell.style.setProperty("--av-rich", `color-mix(in srgb, ${settings.customColors.primary} 42%, var(--av-dark))`);
  }
  if (settings.customColors?.accent) shell.style.setProperty("--av-accent", settings.customColors.accent);
  if (settings.customColors?.background) {
    shell.style.setProperty("--av-bg", settings.customColors.background);
    shell.style.setProperty("--av-cream", settings.customColors.background);
    shell.style.setProperty("--av-surface", `color-mix(in srgb, ${settings.customColors.background} 18%, white)`);
  }
  applyAudio(shell, settings);

  let galleryUrls: string[] | null = null;
  sections.forEach((section) => {
    const node = findTemplateSection(shell, section.type);
    if (!node) return;
    if (!section.enabled) {
      node.hidden = true;
      node.style.setProperty("display", "none", "important");
      return;
    }
    node.hidden = false;
    node.style.removeProperty("display");
    const data = section.data;
    node.style.backgroundColor = typeof data.backgroundColor === "string" ? data.backgroundColor : "";
    node.style.backgroundImage = typeof data.backgroundImageUrl === "string" && data.backgroundImageUrl.trim() ? `url("${data.backgroundImageUrl.trim()}")` : "";
    node.style.backgroundSize = node.style.backgroundImage ? "cover" : "";
    node.style.backgroundPosition = node.style.backgroundImage ? "center" : "";

    node.querySelectorAll<HTMLElement>("[data-field]").forEach((target) => {
      const key = target.dataset.field ?? "";
      const value = data[key];
      if (typeof value === "string") target.textContent = value;
    });
    node.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-placeholder-field]").forEach((target) => {
      const value = data[target.dataset.placeholderField ?? ""];
      if (typeof value === "string") target.placeholder = value;
    });

    const imageUrls = setPhotoSlots(node, data);
    if (section.type === "gallery" && imageUrls) galleryUrls = imageUrls;
    if (section.type === "event") {
      const map = node.querySelector<HTMLAnchorElement>("[data-map-link]");
      if (map && typeof data.mapUrl === "string") map.href = data.mapUrl;
      const dress = node.querySelector<HTMLElement>(".av-dress");
      if (dress) dress.hidden = ![data.dressCodeLabel, data.dressCode, data.dressCodeNote].some((value) => typeof value === "string" && value.trim());
    }
    if (section.type === "gift") {
      const bank = node.querySelector<HTMLElement>("[data-gift-bank-area]");
      const second = node.querySelector<HTMLElement>("[data-gift-second-account]");
      const qrisArea = node.querySelector<HTMLElement>("[data-gift-qris-area]");
      if (bank) bank.hidden = data.showBank === false;
      if (second) second.hidden = data.showBank === false || data.hasSecondAccount !== true;
      if (qrisArea) qrisArea.hidden = data.showQris === false;
      const qris = node.querySelector<HTMLImageElement>("[data-gift-qris]");
      const placeholder = node.querySelector<HTMLElement>("[data-gift-qris-placeholder]");
      const qrisUrl = typeof data.imageUrl === "string" ? data.imageUrl.trim() : "";
      if (qris) {
        if (qrisUrl) qris.setAttribute("src", qrisUrl); else qris.removeAttribute("src");
        qris.hidden = !qrisUrl;
      }
      if (placeholder) placeholder.hidden = Boolean(qrisUrl);
    }
    setTextStyles(node, data.textStyles as Record<string, TextStyle> | undefined);
  });

  if (galleryUrls) window.dispatchEvent(new CustomEvent("avant-vows-gallery", { detail: { urls: galleryUrls } }));
  window.dispatchEvent(new CustomEvent("avant-vows-section-visibility", { detail: { enabled: sections.filter((section) => section.enabled && section.type !== "opening-envelope").map((section) => section.type) } }));
}

export function watchAvantVowsTemplateState(
  sections: AvantVowsPreviewSection[],
  themeId = "ink-vermilion",
  settings: AvantVowsSettings = {},
) {
  applyAvantVowsTemplateState(sections, themeId, settings);
  return () => {};
}
