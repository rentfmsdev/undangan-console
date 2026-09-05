export type VerdantPreviewSection = {
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

export type VerdantSettings = {
  customColors?: { primary?: string; accent?: string; background?: string };
  musicUrl?: string;
  musicVolume?: number;
  useContainer?: boolean;
};

type TextStyle = {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
};

const palettes: Record<string, Record<string, string>> = {
  "verdant-sage": {
    "--vv-bg": "#edf4ef",
    "--vv-surface": "#ffffff",
    "--vv-primary": "#235f4d",
    "--vv-accent": "#c3a66a",
    "--vv-text": "#163b31",
    "--vv-dark": "#12382f",
    "--vv-rich": "#1a4c3e",
    "--vv-mid": "#5f8977",
    "--vv-cream": "#f7faf6",
    "--vv-border": "#cfe0d4",
    "--vv-muted": "#70867e",
  },
  "mist-eucalyptus": {
    "--vv-bg": "#f1f7f4",
    "--vv-surface": "#ffffff",
    "--vv-primary": "#416f62",
    "--vv-accent": "#d2b784",
    "--vv-text": "#1e3f36",
    "--vv-dark": "#254f44",
    "--vv-rich": "#315e52",
    "--vv-mid": "#71998d",
    "--vv-cream": "#f8fbf9",
    "--vv-border": "#d7e5dc",
    "--vv-muted": "#789086",
  },
  "forest-ivory": {
    "--vv-bg": "#f4f5ec",
    "--vv-surface": "#fffefa",
    "--vv-primary": "#315a44",
    "--vv-accent": "#b9985d",
    "--vv-text": "#233d2f",
    "--vv-dark": "#1c3427",
    "--vv-rich": "#274a36",
    "--vv-mid": "#637e6a",
    "--vv-cream": "#fbfbf3",
    "--vv-border": "#d8dfcf",
    "--vv-muted": "#788274",
  },
  "moonlit-mauve": {
    "--vv-bg": "#f5f0f6",
    "--vv-surface": "#fffafe",
    "--vv-primary": "#6b416d",
    "--vv-accent": "#d2a45f",
    "--vv-text": "#36263c",
    "--vv-dark": "#321f3b",
    "--vv-rich": "#4c3155",
    "--vv-mid": "#916f98",
    "--vv-cream": "#fbf7fc",
    "--vv-border": "#e3d9e5",
    "--vv-muted": "#827184",
  },
};

const fontFamilies: Record<string, string> = {
  template: "",
  "great-vibes": "var(--font-great-vibes), cursive",
  "dancing-script": "var(--font-dancing-script), cursive",
  cormorant: "var(--font-cormorant), Georgia, serif",
  manrope: "var(--font-manrope), sans-serif",
};

function applyTextStyle(
  node: HTMLElement,
  styles: Record<string, TextStyle> | undefined,
) {
  node.querySelectorAll<HTMLElement>("[data-field]").forEach((target) => {
    const style = styles?.[target.dataset.field ?? ""];
    target.style.removeProperty("font-family");
    target.style.removeProperty("font-size");
    target.style.removeProperty("color");
    target.style.removeProperty("font-weight");
    target.style.removeProperty("font-style");
    if (!style) return;
    if (style.fontFamily && fontFamilies[style.fontFamily])
      target.style.fontFamily = fontFamilies[style.fontFamily];
    if (typeof style.fontSize === "number")
      target.style.fontSize = `${style.fontSize}px`;
    if (style.color) target.style.color = style.color;
    if (typeof style.bold === "boolean")
      target.style.fontWeight = style.bold ? "700" : "400";
    if (typeof style.italic === "boolean")
      target.style.fontStyle = style.italic ? "italic" : "normal";
  });
}

export function applyVerdantVowsTemplateState(
  sections: VerdantPreviewSection[],
  themeId = "verdant-sage",
  settings: VerdantSettings = {},
) {
  if (typeof document === "undefined") return;
  const shell = document.querySelector<HTMLElement>(".verdant-shell");
  if (!shell) return;
  shell.setAttribute(
    "data-use-container",
    settings.useContainer === false ? "false" : "true",
  );
  Object.entries(palettes[themeId] ?? palettes["verdant-sage"]).forEach(
    ([key, value]) => shell.style.setProperty(key, value),
  );
  if (settings.customColors?.primary) {
    shell.style.setProperty("--vv-primary", settings.customColors.primary);
    shell.style.setProperty("--vv-dark", settings.customColors.primary);
  }
  if (settings.customColors?.accent)
    shell.style.setProperty("--vv-accent", settings.customColors.accent);
  if (settings.customColors?.background)
    shell.style.setProperty("--vv-bg", settings.customColors.background);

  const audio = shell.querySelector<HTMLAudioElement>("audio");
  const source = audio?.querySelector("source");
  if (
    audio &&
    source &&
    settings.musicUrl &&
    source.src !== settings.musicUrl
  ) {
    source.src = settings.musicUrl;
    audio.load();
  }
  if (audio && typeof settings.musicVolume === "number")
    audio.volume = Math.max(0, Math.min(1, settings.musicVolume));

  sections.forEach((section) => {
    const node = shell.querySelector<HTMLElement>(
      `[data-template-section="${CSS.escape(section.type)}"]`,
    );
    if (!node) return;
    if (!section.enabled) {
      node.style.setProperty("display", "none", "important");
      node.setAttribute("hidden", "true");
      return;
    }
    node.style.removeProperty("display");
    node.removeAttribute("hidden");
    const data = section.data;
    node.style.backgroundColor =
      typeof data.backgroundColor === "string" && data.backgroundColor
        ? data.backgroundColor
        : "";
    node.style.backgroundImage =
      typeof data.backgroundImageUrl === "string" && data.backgroundImageUrl
        ? `url("${data.backgroundImageUrl}")`
        : "";
    node.style.backgroundSize = node.style.backgroundImage ? "cover" : "";
    node.style.backgroundPosition = node.style.backgroundImage ? "center" : "";
    node.querySelectorAll<HTMLElement>("[data-field]").forEach((target) => {
      const value = data[target.dataset.field ?? ""];
      const field = target.dataset.field;
      const shouldApplyEmptyValue = [
        "dressCodeLabel",
        "dressCode",
        "dressCodeNote",
      ].includes(field ?? "");
      if (
        typeof value !== "string" ||
        (!value.trim() && !shouldApplyEmptyValue)
      )
        return;
      const cleanedValue =
        field === "akadTime"
          ? value.replace(/^akad nikah\s*[·•-]?\s*/i, "")
          : field === "receptionTime"
            ? value.replace(/^resepsi\s*[·•-]?\s*/i, "")
            : value;
      target.textContent = cleanedValue.trim();
    });
    if (section.type === "event") {
      const dressCodeCard = node.querySelector<HTMLElement>(".vv-dress-code");
      if (dressCodeCard) {
        const hasDressCodeContent = [
          "dressCodeLabel",
          "dressCode",
          "dressCodeNote",
        ].some(
          (field) =>
            typeof data[field] === "string" && Boolean(data[field].trim()),
        );
        dressCodeCard.hidden = !hasDressCodeContent;
      }
    }
    node
      .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "[data-placeholder-field]",
      )
      .forEach((target) => {
        const value = data[target.dataset.placeholderField ?? ""];
        if (typeof value === "string" && value.trim())
          target.placeholder = value.trim();
      });
    const imageSlots = node.querySelectorAll<HTMLImageElement>("[data-image]");
    const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : null;
    if (imageUrls)
      imageSlots.forEach((image, index) => {
        const url = imageUrls[index];
        if (typeof url === "string" && url) image.src = url;
        else image.removeAttribute("src");
      });
    else if ("imageUrl" in data)
      imageSlots.forEach((image) => {
        if (typeof data.imageUrl === "string" && data.imageUrl)
          image.src = data.imageUrl;
        else image.removeAttribute("src");
      });
    if (section.type === "gift") {
      const bankArea = node.querySelector<HTMLElement>("[data-gift-bank-area]");
      if (bankArea) bankArea.hidden = data.showBank === false;
      const secondAccount = node.querySelector<HTMLElement>(
        "[data-gift-second-account]",
      );
      if (secondAccount)
        secondAccount.hidden =
          data.showBank === false || data.hasSecondAccount !== true;
      const qrisArea = node.querySelector<HTMLElement>("[data-gift-qris-area]");
      if (qrisArea) qrisArea.hidden = data.showQris === false;
      const qrisImage =
        node.querySelector<HTMLImageElement>("[data-gift-qris]");
      const qrisPlaceholder = node.querySelector<HTMLElement>(
        "[data-gift-qris-placeholder]",
      );
      const qrisUrl =
        typeof data.imageUrl === "string" ? data.imageUrl.trim() : "";
      if (qrisImage) {
        if (qrisUrl) {
          qrisImage.src = qrisUrl;
          qrisImage.hidden = false;
          if (qrisPlaceholder) qrisPlaceholder.hidden = true;
        } else {
          qrisImage.removeAttribute("src");
          qrisImage.hidden = true;
          if (qrisPlaceholder) qrisPlaceholder.hidden = false;
        }
      }
    }
    if (section.type === "event" && typeof data.mapUrl === "string")
      node
        .querySelector<HTMLAnchorElement>("[data-map-link]")
        ?.setAttribute("href", data.mapUrl);
    if (section.type === "gallery" && imageUrls)
      window.dispatchEvent(
        new CustomEvent("verdant-vows-gallery", {
          detail: {
            urls: imageUrls.filter(
              (url): url is string => typeof url === "string",
            ),
          },
        }),
      );
    applyTextStyle(
      node,
      data.textStyles as Record<string, TextStyle> | undefined,
    );
  });

  // Rail hanya boleh menawarkan section yang sedang aktif. Event ini juga
  // membuat perubahan hide/show dari inspector langsung terasa di preview.
  window.dispatchEvent(
    new CustomEvent("verdant-vows-section-visibility", {
      detail: {
        enabled: sections
          .filter(
            (section) =>
              section.enabled && section.type !== "opening-envelope",
          )
          .map((section) => section.type),
      },
    }),
  );
}

export const watchVerdantVowsTemplateState = (
  sections: VerdantPreviewSection[],
  themeId = "verdant-sage",
  settings: VerdantSettings = {},
) => {
  applyVerdantVowsTemplateState(sections, themeId, settings);
  return () => {};
};
