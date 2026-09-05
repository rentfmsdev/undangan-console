export type EternalOrbitPreviewSection = {
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

export type EternalOrbitSettings = {
  customColors?: { primary?: string; accent?: string; background?: string };
  musicUrl?: string;
  musicVolume?: number;
  useContainer?: boolean;
};

type TextStyle = { fontFamily?: string; fontSize?: number; color?: string; bold?: boolean; italic?: boolean };

const palettes: Record<string, Record<string, string>> = {
  "midnight-sapphire": { "--eo-bg": "#101a31", "--eo-surface": "#172542", "--eo-primary": "#bfa66a", "--eo-accent": "#f0dca2", "--eo-text": "#f8f3e8", "--eo-dark": "#080f21", "--eo-rich": "#142544", "--eo-mid": "#6483af", "--eo-cream": "#f7f3e9", "--eo-border": "#526889", "--eo-muted": "#b7c2d5" },
  "aurora-plum": { "--eo-bg": "#2a1737", "--eo-surface": "#3a2149", "--eo-primary": "#e1ad8c", "--eo-accent": "#f1c990", "--eo-text": "#fff5f1", "--eo-dark": "#1c1027", "--eo-rich": "#4b2b5d", "--eo-mid": "#aa7cae", "--eo-cream": "#fff8f5", "--eo-border": "#795a87", "--eo-muted": "#d7bdd3" },
  "pearl-dawn": { "--eo-bg": "#243746", "--eo-surface": "#334c5e", "--eo-primary": "#9fb9ca", "--eo-accent": "#e0aa92", "--eo-text": "#fffaf5", "--eo-dark": "#14232e", "--eo-rich": "#2b4354", "--eo-mid": "#7795aa", "--eo-cream": "#fffaf5", "--eo-border": "#718b9c", "--eo-muted": "#d2dde2" },
  "celestial-teal": { "--eo-bg": "#082c35", "--eo-surface": "#10424b", "--eo-primary": "#aad5ce", "--eo-accent": "#d7b477", "--eo-text": "#effbf8", "--eo-dark": "#041c23", "--eo-rich": "#0b3640", "--eo-mid": "#4f9294", "--eo-cream": "#f4fbf9", "--eo-border": "#5f9896", "--eo-muted": "#b7d2cd" },
};

const fontFamilies: Record<string, string> = {
  template: "",
  "great-vibes": "var(--font-great-vibes), cursive",
  "dancing-script": "var(--font-dancing-script), cursive",
  cormorant: "var(--font-cormorant), Georgia, serif",
  manrope: "var(--font-manrope), sans-serif",
};

function applyTextStyles(node: HTMLElement, styles: Record<string, TextStyle> | undefined) {
  node.querySelectorAll<HTMLElement>("[data-field]").forEach((target) => {
    const style = styles?.[target.dataset.field ?? ""];
    target.style.removeProperty("font-family");
    target.style.removeProperty("font-size");
    target.style.removeProperty("color");
    target.style.removeProperty("font-weight");
    target.style.removeProperty("font-style");
    if (!style) return;
    if (style.fontFamily && fontFamilies[style.fontFamily]) target.style.fontFamily = fontFamilies[style.fontFamily];
    if (typeof style.fontSize === "number") target.style.fontSize = `${style.fontSize}px`;
    if (style.color) target.style.color = style.color;
    if (typeof style.bold === "boolean") target.style.fontWeight = style.bold ? "700" : "400";
    if (typeof style.italic === "boolean") target.style.fontStyle = style.italic ? "italic" : "normal";
  });
}

function setImageSlots(node: HTMLElement, data: Record<string, unknown>) {
  const images = node.querySelectorAll<HTMLImageElement>("[data-image]");
  const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : null;
  if (imageUrls) {
    images.forEach((image, index) => {
      const url = imageUrls[index];
      if (typeof url === "string" && url.trim()) image.src = url;
      else image.removeAttribute("src");
    });
    return imageUrls;
  }
  if ("imageUrl" in data) {
    images.forEach((image) => {
      if (typeof data.imageUrl === "string" && data.imageUrl.trim()) image.src = data.imageUrl;
      else image.removeAttribute("src");
    });
  }
  return null;
}

export function applyEternalOrbitTemplateState(
  sections: EternalOrbitPreviewSection[],
  themeId = "midnight-sapphire",
  settings: EternalOrbitSettings = {},
) {
  if (typeof document === "undefined") return;
  const shell = document.querySelector<HTMLElement>(".eternal-orbit-shell");
  if (!shell) return;
  shell.setAttribute("data-use-container", settings.useContainer === false ? "false" : "true");
  Object.entries(palettes[themeId] ?? palettes["midnight-sapphire"]).forEach(([key, value]) => shell.style.setProperty(key, value));
  if (settings.customColors?.primary) {
    shell.style.setProperty("--eo-primary", settings.customColors.primary);
    shell.style.setProperty("--eo-rich", `color-mix(in srgb, ${settings.customColors.primary} 34%, var(--eo-dark))`);
    shell.style.setProperty("--eo-mid", `color-mix(in srgb, ${settings.customColors.primary} 68%, var(--eo-text))`);
  }
  if (settings.customColors?.accent) shell.style.setProperty("--eo-accent", settings.customColors.accent);
  if (settings.customColors?.background) {
    shell.style.setProperty("--eo-bg", settings.customColors.background);
    shell.style.setProperty("--eo-surface", `color-mix(in srgb, ${settings.customColors.background} 82%, var(--eo-text))`);
  }

  const audio = shell.querySelector<HTMLAudioElement>("audio");
  const source = audio?.querySelector<HTMLSourceElement>("source");
  if (audio && source && settings.musicUrl && source.src !== new URL(settings.musicUrl, window.location.origin).href) {
    source.src = settings.musicUrl;
    audio.load();
  }
  if (audio && typeof settings.musicVolume === "number") audio.volume = Math.max(0, Math.min(1, settings.musicVolume));

  sections.forEach((section) => {
    const node = shell.querySelector<HTMLElement>(`[data-template-section="${CSS.escape(section.type)}"]`);
    if (!node) return;
    if (!section.enabled) {
      node.style.setProperty("display", "none", "important");
      node.hidden = true;
      return;
    }
    node.style.removeProperty("display");
    node.hidden = false;
    const data = section.data;
    node.dataset.decorVariant = typeof data.decorationVariant === "string" ? data.decorationVariant : "";
    node.dataset.motion = data.motionStyle === "soft" || data.motionStyle === "off" ? data.motionStyle : "cinematic";
    node.dataset.particles = data.showParticles === false ? "off" : "on";
    const decorationIntensity = typeof data.decorationIntensity === "number" ? Math.max(0, Math.min(100, data.decorationIntensity)) : 65;
    node.style.setProperty("--eo-decor-intensity", String(decorationIntensity / 100));
    node.style.backgroundColor = typeof data.backgroundColor === "string" ? data.backgroundColor : "";
    node.style.backgroundImage = typeof data.backgroundImageUrl === "string" && data.backgroundImageUrl ? `url("${data.backgroundImageUrl}")` : "";
    node.style.backgroundSize = node.style.backgroundImage ? "cover" : "";
    node.style.backgroundPosition = node.style.backgroundImage ? "center" : "";
    node.querySelectorAll<HTMLElement>("[data-field]").forEach((target) => {
      const value = data[target.dataset.field ?? ""];
      if (typeof value === "string" && value.trim()) target.textContent = value.trim();
    });
    node.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-placeholder-field]").forEach((target) => {
      const value = data[target.dataset.placeholderField ?? ""];
      if (typeof value === "string" && value.trim()) target.placeholder = value.trim();
    });
    const imageUrls = setImageSlots(node, data);
    if (section.type === "event" && typeof data.mapUrl === "string") node.querySelector<HTMLAnchorElement>("[data-map-link]")?.setAttribute("href", data.mapUrl);
    if (section.type === "gift") {
      const bankArea = node.querySelector<HTMLElement>("[data-gift-bank-area]");
      const secondAccount = node.querySelector<HTMLElement>("[data-gift-second-account]");
      const qrisArea = node.querySelector<HTMLElement>("[data-gift-qris-area]");
      if (bankArea) bankArea.hidden = data.showBank === false;
      if (secondAccount) secondAccount.hidden = data.showBank === false || data.hasSecondAccount !== true;
      if (qrisArea) qrisArea.hidden = data.showQris === false;
      const qris = node.querySelector<HTMLImageElement>("[data-gift-qris]");
      const placeholder = node.querySelector<HTMLElement>("[data-gift-qris-placeholder]");
      const qrisUrl = typeof data.imageUrl === "string" ? data.imageUrl.trim() : "";
      if (qris) qris.src = qrisUrl;
      if (qris) qris.hidden = !qrisUrl;
      if (placeholder) placeholder.hidden = Boolean(qrisUrl);
    }
    if (section.type === "gallery" && imageUrls) window.dispatchEvent(new CustomEvent("eternal-orbit-gallery", { detail: { urls: imageUrls.filter((url): url is string => typeof url === "string" && Boolean(url.trim())) } }));
    applyTextStyles(node, data.textStyles as Record<string, TextStyle> | undefined);
  });

  window.dispatchEvent(new CustomEvent("eternal-orbit-section-visibility", { detail: { enabled: sections.filter((section) => section.enabled).map((section) => section.type) } }));
}

export const watchEternalOrbitTemplateState = (sections: EternalOrbitPreviewSection[], themeId = "midnight-sapphire", settings: EternalOrbitSettings = {}) => {
  applyEternalOrbitTemplateState(sections, themeId, settings);
  return () => {};
};
