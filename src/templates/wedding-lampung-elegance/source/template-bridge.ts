export type WeddingPreviewSection = {
  id: string;
  type: string;
  enabled: boolean;
  data: {
    title?: string;
    subtitle?: string;
    backgroundColor?: string;
    imageLabel?: string;
    imageUrl?: string;
    imageUrls?: string[];
    [key: string]: unknown;
  };
};

export type WeddingGlobalSettings = {
  musicUrl?: string;
  musicVolume?: number;
  customColors?: {
    primary?: string;
    accent?: string;
    background?: string;
  };
  useContainer?: boolean;
};

export const WEDDING_GALLERY_UPDATE_EVENT = "wedding:gallery-update";

export const weddingSectionSelectors = {
  "opening-envelope": ".opening-screen",
  hero: ".hero",
  couple: ".welcome",
  countdown: ".countdown-section",
  map: ".location-card",
  "unduh-mantu": ".unduh-card",
  event: ".event-section",
  quote: ".quote-section",
  gallery: ".gallery-section",
  gift: ".gift-section",
  wishes: ".wishes-section",
  closing: ".closing-section",
} as const;

const topLevelSectionTypes = [
  "hero",
  "couple",
  "countdown",
  "event",
  "quote",
  "gallery",
  "gift",
  "wishes",
  "closing",
] as const;

const themeVariables: Record<string, Record<string, string>> = {
  "maroon-gold": {
    "--maroon": "#5b232d",
    "--maroon-soft": "#7b3039",
    "--wine": "#91444e",
    "--gold": "#caa254",
    "--gold-light": "#e4d1a1",
    "--ivory": "#fdf7eb",
    "--paper": "#fffaf0",
    "--sage": "#728170",
    "--sage-light": "#c8cebc",
    "--ink": "#382326",
    "--theme-deep": "#2c0e13",
    "--theme-rich": "#50151d",
    "--theme-mid": "#722a35",
    "--theme-cream": "#fff5dc",
    "--theme-border": "#e4c880",
  },
  "blue-gold": {
    "--maroon": "#994b36",
    "--maroon-soft": "#b96a50",
    "--wine": "#7f382b",
    "--gold": "#d2a24b",
    "--gold-light": "#f0d49d",
    "--ivory": "#fff7f0",
    "--paper": "#fffaf6",
    "--sage": "#8b6e62",
    "--sage-light": "#e3ccc0",
    "--ink": "#472b25",
    "--theme-deep": "#42231e",
    "--theme-rich": "#633026",
    "--theme-mid": "#b96a50",
    "--theme-cream": "#fff4e8",
    "--theme-border": "#d2a24b",
  },
  "ivory-gold": {
    "--maroon": "#66502d",
    "--maroon-soft": "#8a7041",
    "--wine": "#9b7c43",
    "--gold": "#bb923f",
    "--gold-light": "#ead9ae",
    "--ivory": "#fffdf7",
    "--paper": "#fffaf5",
    "--sage": "#7e7a61",
    "--sage-light": "#d9d4bd",
    "--ink": "#443c2d",
    "--theme-deep": "#3e321d",
    "--theme-rich": "#5d4828",
    "--theme-mid": "#9b7c43",
    "--theme-cream": "#fff9ec",
    "--theme-border": "#bb923f",
  },
  "sage-gold": {
    "--maroon": "#3f594e",
    "--maroon-soft": "#60786b",
    "--wine": "#6f8778",
    "--gold": "#c29c4d",
    "--gold-light": "#ead9a8",
    "--ivory": "#f7f8ef",
    "--paper": "#fbfbf5",
    "--sage": "#4d665b",
    "--sage-light": "#cbd6c8",
    "--ink": "#33453b",
    "--theme-deep": "#20372c",
    "--theme-rich": "#314b3b",
    "--theme-mid": "#6f8778",
    "--theme-cream": "#f5faf2",
    "--theme-border": "#c29c4d",
  },
};

const fontFamilies: Record<string, string> = {
  "great-vibes": "var(--font-great-vibes)",
  "dancing-script": "var(--font-dancing-script)",
  cormorant: "var(--font-cormorant)",
  manrope: "var(--font-manrope)",
};

const fieldFontTargets: Record<string, Record<string, string>> = {
  "opening-envelope": { eyebrow: ".opening-eyebrow", kicker: ".opening-title > p, .letter-kicker", title: ".opening-title h1, .letter-couple", date: ".opening-date, .invitation-letter > em", guestLabel: ".letter-to, .envelope-address small", sealMonogram: ".seal-monogram", sealLabel: ".wax-seal > small", callout: ".seal-callout b", subtitle: ".seal-callout small", footer: ".opening-footer-note" },
  hero: { monogram: ".hero-monogram, .hero-monogram *", kicker: ".hero-kicker", title: ".hero-content h1", subtitle: ".hero-date", guestLabel: ".hero-guest small", scrollLabel: ".scroll-cue span" },
  couple: { bismillah: ".bismillah", greeting: ".greeting", subtitle: ".intro-copy", brideLabel: ".couple-block:first-of-type .script-label", brideName: ".couple-block:first-of-type h2", brideOrder: ".couple-block:first-of-type > p:not(.script-label)", brideParents: ".couple-block:first-of-type > strong", groomLabel: ".couple-block:last-of-type .script-label", groomName: ".couple-block:last-of-type h2", groomOrder: ".couple-block:last-of-type > p:not(.script-label)", groomParents: ".couple-block:last-of-type > strong" },
  countdown: { subtitle: ".countdown-content > p", title: ".countdown-content h2", daysLabel: ".countdown-item:nth-child(1) span", hoursLabel: ".countdown-item:nth-child(2) span", minutesLabel: ".countdown-item:nth-child(3) span", secondsLabel: ".countdown-item:nth-child(4) span", buttonLabel: ".light-button" },
  event: { eyebrow: ".section-heading > span", title: ".section-heading h2", subtitle: ".event-invite", day: ".date-ribbon span:first-child", date: ".date-ribbon strong", monthYear: ".date-ribbon span:last-child", akadTitle: ".event-card:first-child > p", akadTime: ".event-card:first-child h3", akadNote: ".event-card:first-child > span", receptionTitle: ".event-card:last-child > p", receptionTime: ".event-card:last-child h3", receptionNote: ".event-card:last-child > span" },
  map: { title: ":scope > small", subtitle: ":scope > p", buttonLabel: ":scope > a" },
  "unduh-mantu": { kicker: ".unduh-content > small", title: ".unduh-content > p", subtitle: ".unduh-content > h3", address: ".unduh-address span", buttonLabel: ".unduh-content > a" },
  quote: { title: "blockquote", subtitle: "blockquote cite" },
  gallery: { eyebrow: ".section-heading > span", title: ".section-heading h2", viewLabel: ".gallery-item em", subtitle: ".gallery-signature", lightboxTitle: ".lightbox-caption span" },
  gift: { eyebrow: ".section-heading > span", title: ".section-heading h2", subtitle: ".gift-copy", bank1: ".bank-card:first-child .bank-top span", account1: ".bank-card:first-child > strong", holder1: ".bank-card:first-child > p", bank2: ".bank-card:last-child .bank-top span", account2: ".bank-card:last-child > strong", holder2: ".bank-card:last-child > p", buttonLabel: ".bank-card button", copiedLabel: ".bank-card button" },
  wishes: { eyebrow: ".section-heading > span", title: ".section-heading h2", formTitle: ".wish-form-heading strong", subtitle: ".wish-form-heading small", nameLabel: "label[for='wish-name']", namePlaceholder: "#wish-name", attendanceLabel: ".wedding-field:has(.attendance-options) .wedding-field-label", presentLabel: ".attendance-options label:nth-child(1) span", unsureLabel: ".attendance-options label:nth-child(2) span", absentLabel: ".attendance-options label:nth-child(3) span", messageLabel: "label[for='wish-message']", messagePlaceholder: "#wish-message", submitLabel: ".wish-submit", savingLabel: ".wish-submit", successLabel: ".wish-form-message", celebrationLabel: ".celebration strong", loadingLabel: ".empty-wishes", emptyLabel: ".empty-wishes" },
  closing: { title: ".closing-content > p", copy: ".closing-content > span", subtitle: ".closing-content h2", greeting: ".closing-content > small", date: ".closing-content > b" },
};

const backgroundImageTargets: Record<string, string> = {
  countdown: ".countdown-image",
};

const nativeBackgroundImages: Record<string, string> = {
  countdown: "/assets/my/DSC_0838%20(1).jpg.jpeg",
};

export function getWeddingSectionElement(type: string, root: ParentNode = document) {
  const selector = weddingSectionSelectors[type as keyof typeof weddingSectionSelectors];
  return selector ? root.querySelector<HTMLElement>(selector) : null;
}

function setText(element: Element | null, value?: string) {
  if (element && value !== undefined && element.textContent !== value) element.textContent = value;
}

function setTextKeepingChildren(element: Element | null, value?: string) {
  if (!element || value === undefined) return;
  const textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
  if (textNode) {
    if (textNode.textContent?.trim() !== value) textNode.textContent = ` ${value}`;
    return;
  }
  element.append(` ${value}`);
}

function setNames(element: HTMLElement | null, value?: string, accentTag = "span") {
  if (!element || !value) return;
  if (element.textContent?.replace(/\s+/g, " ").trim() === value.replace(/\s+/g, " ").trim()) return;
  const [first, ...remaining] = value.split(/\s*&\s*/);
  const second = remaining.join(" & ");
  element.replaceChildren(document.createTextNode(first.trim()));
  if (second) {
    const ampersand = document.createElement(accentTag);
    ampersand.textContent = "&";
    element.append(" ", ampersand, ` ${second.trim()}`);
  }
}

function setHeroMonogram(element: HTMLElement | null, value?: string) {
  if (!element || !value) return;
  if (element.textContent?.replace(/\s+/g, " ").trim() === value.replace(/\s+/g, " ").trim()) return;
  const [first, ...remaining] = value.split(/\s*&\s*/);
  const second = remaining.join(" & ");
  const firstName = document.createElement("span");
  firstName.textContent = first.trim();
  element.replaceChildren(firstName);
  if (second) {
    const ampersand = document.createElement("i");
    ampersand.textContent = "&";
    const secondName = document.createElement("span");
    secondName.textContent = second.trim();
    element.append(ampersand, secondName);
  }
}

function setQuoteText(element: HTMLElement | null, value?: string) {
  if (!element || !value) return;
  const textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
  if (textNode && textNode.textContent?.trim() !== value) textNode.textContent = `\n        ${value}\n        `;
}

function applyImage(element: HTMLElement, selector: string, url?: string) {
  if (!url) return;
  const image = element.querySelector<HTMLImageElement>(selector);
  if (!image) return;
  if (!image.dataset.templateOriginalSrc) {
    image.dataset.templateOriginalSrc = image.src;
    image.dataset.templateOriginalSrcset = image.srcset;
  }
  if (image.getAttribute("src") !== url) image.src = url;
  if (image.srcset) image.srcset = "";
}

function restoreImage(element: HTMLElement, selector: string) {
  const image = element.querySelector<HTMLImageElement>(selector);
  if (!image?.dataset.templateOriginalSrc) return;
  image.src = image.dataset.templateOriginalSrc;
  image.srcset = image.dataset.templateOriginalSrcset ?? "";
}

function applyEditableImage(element: HTMLElement, selector: string, url: unknown) {
  const image = element.querySelector<HTMLImageElement>(selector);
  if (!image) return;
  const nextUrl = typeof url === "string" ? url.trim() : "";
  if (!nextUrl) {
    image.style.display = "none";
    return;
  }
  image.style.removeProperty("display");
  applyImage(element, selector, nextUrl);
}

function applySectionBackground(section: WeddingPreviewSection, element: HTMLElement) {
  const color = typeof section.data.backgroundColor === "string" ? section.data.backgroundColor : "";
  const imageUrl = typeof section.data.backgroundImageUrl === "string" ? section.data.backgroundImageUrl : "";
  const targetSelector = backgroundImageTargets[section.type];
  const target = targetSelector ? element.querySelector<HTMLElement>(targetSelector) : null;

  if (target instanceof HTMLImageElement) {
    if (imageUrl) applyImage(element, targetSelector, imageUrl);
    else if (!section.data.imageUrl) restoreImage(element, targetSelector);
  } else if (target) {
    if (imageUrl && imageUrl !== nativeBackgroundImages[section.type]) {
      target.style.backgroundImage = `url("${imageUrl.replaceAll('"', '%22')}")`;
      target.style.backgroundSize = "cover";
      target.style.backgroundPosition = "center";
    } else if (!imageUrl && Object.hasOwn(section.data, "backgroundImageUrl") && nativeBackgroundImages[section.type]) {
      target.style.backgroundImage = "none";
      target.style.removeProperty("background-size");
      target.style.removeProperty("background-position");
    } else {
      target.style.removeProperty("background-image");
      target.style.removeProperty("background-size");
      target.style.removeProperty("background-position");
    }
  } else {
    if (imageUrl) {
      element.style.backgroundImage = `url("${imageUrl.replaceAll('"', '%22')}")`;
      element.style.backgroundSize = "cover";
      element.style.backgroundPosition = "center";
    } else {
      element.style.removeProperty("background-image");
      element.style.removeProperty("background-size");
      element.style.removeProperty("background-position");
    }
  }

  if (color) element.style.setProperty("background-color", color);
  else element.style.removeProperty("background-color");
}

function applyFieldFonts(section: WeddingPreviewSection, element: HTMLElement) {
  const fontStyles = section.data.fontStyles && typeof section.data.fontStyles === "object" ? section.data.fontStyles as Record<string, string> : {};
  const textStyles = section.data.textStyles && typeof section.data.textStyles === "object" ? section.data.textStyles as Record<string, { fontFamily?: string; fontSize?: number; color?: string; bold?: boolean; italic?: boolean }> : {};
  const targets = fieldFontTargets[section.type] ?? {};
  const applyTypography = (target: HTMLElement | null, key: string) => {
    if (!target) return;
    const style = textStyles[key] ?? {};
    const family = fontFamilies[style.fontFamily ?? fontStyles[key]];
    if (family) target.style.fontFamily = family;
    else target.style.removeProperty("font-family");
    if (typeof style.fontSize === "number" && Number.isFinite(style.fontSize)) target.style.fontSize = `${Math.min(120, Math.max(8, style.fontSize))}px`;
    else target.style.removeProperty("font-size");
    if (style.color) target.style.color = style.color;
    else target.style.removeProperty("color");
    if (style.bold) target.style.fontWeight = "700";
    else target.style.removeProperty("font-weight");
    if (style.italic) target.style.fontStyle = "italic";
    else target.style.removeProperty("font-style");
  };
  for (const [key, selector] of Object.entries(targets)) {
    element.querySelectorAll<HTMLElement>(selector).forEach((target) => applyTypography(target, key));
  }

  if (section.type === "gallery") applyTypography(document.querySelector<HTMLElement>(".gallery-lightbox .lightbox-caption span"), "lightboxTitle");
  if (section.type === "gift") {
    element.querySelectorAll<HTMLElement>(".bank-card button").forEach((button) => applyTypography(button, button.querySelector(".lucide-check") ? "copiedLabel" : "buttonLabel"));
  }
  if (section.type === "wishes") {
    const submit = element.querySelector<HTMLElement>(".wish-submit");
    applyTypography(submit, submit?.querySelector(".submit-spinner") ? "savingLabel" : "submitLabel");
    const empty = element.querySelector<HTMLElement>(".empty-wishes");
    applyTypography(empty, empty?.dataset.wishState === "loading" ? "loadingLabel" : "emptyLabel");
    applyTypography(element.querySelector<HTMLElement>(".wish-form-message[data-wish-state='success']"), "successLabel");
    applyTypography(element.querySelector<HTMLElement>(".celebration strong"), "celebrationLabel");
  }
}

function applyCountdown(section: WeddingPreviewSection, element: HTMLElement) {
  const targetDate = typeof section.data.targetDate === "string" ? section.data.targetDate : "";
  if (targetDate) document.documentElement.dataset.weddingTargetDate = targetDate;
  else delete document.documentElement.dataset.weddingTargetDate;

  const gap = Math.max(0, new Date(targetDate || "2026-09-26T08:00").getTime() - Date.now());
  const values = [
    Math.floor(gap / 86_400_000),
    Math.floor((gap / 3_600_000) % 24),
    Math.floor((gap / 60_000) % 60),
    Math.floor((gap / 1_000) % 60),
  ];
  element.querySelectorAll<HTMLElement>(".countdown-item strong").forEach((target, index) => setText(target, String(values[index] ?? 0).padStart(2, "0")));
  ["daysLabel", "hoursLabel", "minutesLabel", "secondsLabel"].forEach((key, index) => {
    const value = section.data[key];
    if (typeof value === "string") setText(element.querySelectorAll(".countdown-item span")[index], value);
  });
}

function applySectionText(section: WeddingPreviewSection, element: HTMLElement) {
  const { title, subtitle, imageUrl } = section.data;
  const field = (key: string) => typeof section.data[key] === "string" ? section.data[key] as string : undefined;

  switch (section.type) {
    case "opening-envelope":
      setText(element.querySelector(".opening-eyebrow"), field("eyebrow"));
      setText(element.querySelector(".opening-title > p"), field("kicker"));
      setText(element.querySelector(".letter-kicker"), field("kicker"));
      setNames(element.querySelector<HTMLElement>(".opening-title h1"), title, "b");
      setNames(element.querySelector<HTMLElement>(".letter-couple"), title, "i");
      setText(element.querySelector(".opening-date"), field("date"));
      setText(element.querySelector(".invitation-letter > em"), field("date"));
      element.querySelectorAll(".letter-to, .envelope-address small").forEach((target) => setText(target, field("guestLabel")));
      setNames(element.querySelector<HTMLElement>(".seal-monogram"), field("sealMonogram"), "i");
      setText(element.querySelector(".wax-seal > small"), field("sealLabel"));
      setText(element.querySelector(".seal-callout b"), field("callout"));
      setText(element.querySelector(".seal-callout small"), subtitle);
      setText(element.querySelector(".opening-footer-note"), field("footer"));
      break;
    case "hero":
      setHeroMonogram(element.querySelector<HTMLElement>(".hero-monogram"), field("monogram"));
      setText(element.querySelector(".hero-kicker"), field("kicker"));
      setNames(element.querySelector<HTMLElement>(".hero-content h1"), title);
      setText(element.querySelector(".hero-date"), subtitle);
      setText(element.querySelector(".hero-guest small"), field("guestLabel"));
      setText(element.querySelector(".scroll-cue span"), field("scrollLabel"));
      applyEditableImage(element, ".hero-photo", imageUrl);
      break;
    case "couple": {
      const headings = element.querySelectorAll(".couple-block h2");
      const fallbackNames = title?.split(/\s*&\s*/).map((name) => name.trim()) ?? [];
      setText(element.querySelector(".bismillah"), field("bismillah"));
      setText(element.querySelector(".greeting"), field("greeting"));
      setText(headings[0], field("brideName") ?? fallbackNames[0]);
      setText(headings[1], field("groomName") ?? fallbackNames[1]);
      setText(element.querySelector(".intro-copy"), subtitle);
      const blocks = element.querySelectorAll(".couple-block");
      setText(blocks[0]?.querySelector(".script-label"), field("brideLabel"));
      setText(blocks[0]?.querySelector(":scope > p:not(.script-label)"), field("brideOrder"));
      setText(blocks[0]?.querySelector(":scope > strong"), field("brideParents"));
      setText(blocks[1]?.querySelector(".script-label"), field("groomLabel"));
      setText(blocks[1]?.querySelector(":scope > p:not(.script-label)"), field("groomOrder"));
      setText(blocks[1]?.querySelector(":scope > strong"), field("groomParents"));
      applyEditableImage(element, ".welcome-portrait img", imageUrl);
      break;
    }
    case "countdown":
      setText(element.querySelector(".countdown-content h2"), title);
      setText(element.querySelector(".countdown-content > p"), subtitle);
      setTextKeepingChildren(element.querySelector(".light-button"), field("buttonLabel"));
      if (field("calendarUrl")) element.querySelector<HTMLAnchorElement>(".light-button")?.setAttribute("href", field("calendarUrl")!);
      applyCountdown(section, element);
      break;
    case "event":
      setText(element.querySelector(".section-heading > span"), field("eyebrow"));
      setText(element.querySelector(".section-heading h2"), title);
      setText(element.querySelector(".event-invite"), subtitle);
      setText(element.querySelector(".date-ribbon span:first-child"), field("day"));
      setText(element.querySelector(".date-ribbon strong"), field("date"));
      setText(element.querySelector(".date-ribbon span:last-child"), field("monthYear"));
      setText(element.querySelector(".event-card:first-child > p"), field("akadTitle"));
      setText(element.querySelector(".event-card:first-child h3"), field("akadTime"));
      setTextKeepingChildren(element.querySelector(".event-card:first-child > span"), field("akadNote"));
      setText(element.querySelector(".event-card:last-child > p"), field("receptionTitle"));
      setText(element.querySelector(".event-card:last-child h3"), field("receptionTime"));
      setTextKeepingChildren(element.querySelector(".event-card:last-child > span"), field("receptionNote"));
      break;
    case "map":
      setText(element.querySelector(":scope > small"), title);
      setText(element.querySelector(":scope > p"), subtitle);
      if (field("mapUrl")) element.querySelector<HTMLAnchorElement>(":scope > a")?.setAttribute("href", field("mapUrl")!);
      setText(element.querySelector(":scope > a"), field("buttonLabel"));
      break;
    case "unduh-mantu":
      setText(element.querySelector(".unduh-content > p"), title);
      setText(element.querySelector(".unduh-content > h3"), subtitle);
      setText(element.querySelector(".unduh-content > small"), field("kicker"));
      setText(element.querySelector(".unduh-address span"), field("address"));
      if (field("mapUrl")) element.querySelector<HTMLAnchorElement>(".unduh-content > a")?.setAttribute("href", field("mapUrl")!);
      setText(element.querySelector(".unduh-content > a"), field("buttonLabel"));
      break;
    case "quote":
      setQuoteText(element.querySelector<HTMLElement>("blockquote"), title);
      setText(element.querySelector("blockquote cite"), subtitle);
      applyEditableImage(element, ":scope > img", imageUrl);
      break;
    case "gallery":
      setText(element.querySelector(".section-heading > span"), field("eyebrow"));
      setText(element.querySelector(".section-heading h2"), title);
      setText(element.querySelector(".gallery-signature"), subtitle);
      element.querySelectorAll(".gallery-item em").forEach((target) => setText(target, field("viewLabel")));
      setNames(document.querySelector<HTMLElement>(".gallery-lightbox .lightbox-caption span"), field("lightboxTitle"), "i");
      applyImage(element, ".gallery-item img", imageUrl);
      if (Array.isArray(section.data.imageUrls)) {
        const photos = section.data.imageUrls.filter((url): url is string => typeof url === "string" && Boolean(url));
        window.dispatchEvent(new CustomEvent(WEDDING_GALLERY_UPDATE_EVENT, { detail: { photos } }));
        element.querySelectorAll<HTMLImageElement>(".gallery-item img").forEach((image, index) => {
          const url = photos[index];
          if (url) { image.src = url; image.srcset = ""; }
        });
        const lightboxImage = element.parentElement?.querySelector<HTMLImageElement>(".gallery-lightbox .lightbox-photo-frame img") ?? document.querySelector<HTMLImageElement>(".gallery-lightbox .lightbox-photo-frame img");
        const currentNumber = Number(document.querySelector(".gallery-lightbox .lightbox-caption b")?.textContent?.match(/\d+/)?.[0] ?? 1);
        const lightboxUrl = photos[currentNumber - 1];
        if (lightboxImage && lightboxUrl) { lightboxImage.src = lightboxUrl; lightboxImage.srcset = ""; }
      }
      break;
    case "gift":
      setText(element.querySelector(".section-heading > span"), field("eyebrow"));
      setText(element.querySelector(".section-heading h2"), title);
      setText(element.querySelector(".gift-copy"), subtitle);
      element.querySelectorAll<HTMLElement>(".bank-card").forEach((card, index) => {
        const number = index + 1;
        setText(card.querySelector(".bank-top span"), field(`bank${number}`));
        setText(card.querySelector(":scope > strong"), field(`account${number}`));
        setText(card.querySelector(":scope > p"), field(`holder${number}`));
        const isCopied = Boolean(card.querySelector("button .lucide-check"));
        setTextKeepingChildren(card.querySelector("button"), isCopied ? field("copiedLabel") : field("buttonLabel"));
      });
      break;
    case "wishes": {
      setText(element.querySelector(".section-heading > span"), field("eyebrow"));
      setText(element.querySelector(".section-heading h2"), title);
      setText(element.querySelector(".wish-form-heading strong"), field("formTitle"));
      setText(element.querySelector(".wish-form-heading small"), subtitle);
      const weddingFields = element.querySelectorAll(".wedding-field");
      setText(weddingFields[0]?.querySelector(".wedding-field-label span:last-child"), field("nameLabel"));
      element.querySelector<HTMLInputElement>("#wish-name")?.setAttribute("placeholder", field("namePlaceholder") ?? "");
      setText(weddingFields[1]?.querySelector(".wedding-field-label span:last-child"), field("attendanceLabel"));
      element.querySelectorAll(".attendance-options label span").forEach((target, index) => setText(target, field(["presentLabel", "unsureLabel", "absentLabel"][index])));
      setText(weddingFields[2]?.querySelector(".wedding-field-label span:last-child"), field("messageLabel"));
      element.querySelector<HTMLTextAreaElement>("#wish-message")?.setAttribute("placeholder", field("messagePlaceholder") ?? "");
      const isSaving = Boolean(element.querySelector(".wish-submit .submit-spinner"));
      setTextKeepingChildren(element.querySelector(".wish-submit"), isSaving ? field("savingLabel") : field("submitLabel"));
      setText(element.querySelector(".celebration strong"), field("celebrationLabel"));
      const formMessage = element.querySelector<HTMLElement>(".wish-form-message");
      if (formMessage?.dataset.wishState === "success") setText(formMessage, field("successLabel"));
      const emptyMessage = element.querySelector<HTMLElement>(".empty-wishes");
      setText(emptyMessage, emptyMessage?.dataset.wishState === "loading" ? field("loadingLabel") : field("emptyLabel"));
      break;
    }
    case "closing":
      setText(element.querySelector(".closing-content > p"), title);
      setNames(element.querySelector<HTMLElement>(".closing-content h2"), subtitle, "i");
      setText(element.querySelector(".closing-content > span"), field("copy"));
      setText(element.querySelector(".closing-content > small"), field("greeting"));
      setText(element.querySelector(".closing-content > b"), field("date"));
      applyEditableImage(element, ":scope > img", imageUrl);
      break;
  }
}

function applyTheme(themeId: string) {
  const root = document.documentElement;
  const invitation = document.querySelector<HTMLElement>(".invitation-shell");
  const variableNames = new Set(Object.values(themeVariables).flatMap((theme) => Object.keys(theme)));
  for (const name of variableNames) root.style.removeProperty(name);
  for (const [name, value] of Object.entries(themeVariables[themeId] ?? {})) root.style.setProperty(name, value);
  invitation?.style.removeProperty("--font-script");
  invitation?.style.removeProperty("--font-serif");
  invitation?.style.removeProperty("--font-sans");
  if (themeId === "sage-gold") {
    invitation?.style.setProperty("--font-script", "var(--font-dancing-script)");
    invitation?.style.setProperty("--font-sans", "var(--font-cormorant)");
  }
}

function applyTopLevelOrder(sections: WeddingPreviewSection[]) {
  const page = document.querySelector<HTMLElement>(".invitation-page");
  if (!page) return;
  const nodes = new Map<string, HTMLElement>();
  for (const type of topLevelSectionTypes) {
    const element = getWeddingSectionElement(type, page);
    if (element?.parentElement === page) nodes.set(type, element);
  }
  for (const section of sections) {
    const element = nodes.get(section.type);
    if (element) page.appendChild(element);
  }
}

function applyEventSubsectionOrder(sections: WeddingPreviewSection[]) {
  const event = getWeddingSectionElement("event");
  const map = getWeddingSectionElement("map");
  const unduh = getWeddingSectionElement("unduh-mantu");
  const divider = event?.querySelector<HTMLElement>(".event-pattern-divider");
  if (!event || !map || !unduh || !divider) return;

  const mapIndex = sections.findIndex((section) => section.type === "map");
  const unduhIndex = sections.findIndex((section) => section.type === "unduh-mantu");
  if (unduhIndex >= 0 && mapIndex >= 0 && unduhIndex < mapIndex) event.append(divider, unduh, map);
  else event.append(map, divider, unduh);

  const unduhSection = sections.find((section) => section.type === "unduh-mantu");
  divider.style.display = unduhSection?.enabled === false ? "none" : "";
}

export function applyWeddingTemplateState(sections: WeddingPreviewSection[], themeId: string, settings: WeddingGlobalSettings = {}) {
  applyTheme(themeId);
  if (settings.customColors) {
    const root = document.documentElement;
    if (settings.customColors.primary) {
      root.style.setProperty("--maroon", settings.customColors.primary);
      root.style.setProperty("--maroon-soft", `color-mix(in srgb, ${settings.customColors.primary} 72%, white)`);
      root.style.setProperty("--wine", `color-mix(in srgb, ${settings.customColors.primary} 82%, black)`);
      root.style.setProperty("--theme-deep", `color-mix(in srgb, ${settings.customColors.primary} 60%, black)`);
      root.style.setProperty("--theme-rich", `color-mix(in srgb, ${settings.customColors.primary} 76%, black)`);
      root.style.setProperty("--theme-mid", `color-mix(in srgb, ${settings.customColors.primary} 72%, white)`);
    }
    if (settings.customColors.accent) {
      root.style.setProperty("--gold", settings.customColors.accent);
      root.style.setProperty("--theme-border", settings.customColors.accent);
    }
    if (settings.customColors.background) {
      root.style.setProperty("--ivory", settings.customColors.background);
      root.style.setProperty("--paper", settings.customColors.background);
      root.style.setProperty("--theme-cream", `color-mix(in srgb, ${settings.customColors.background} 88%, white)`);
    }
  }
  applyTopLevelOrder(sections);
  applyEventSubsectionOrder(sections);

  const page = document.querySelector<HTMLElement>(".invitation-page");
  if (page) {
    page.setAttribute("data-use-container", settings.useContainer === false ? "false" : "true");
  }

  const audio = document.querySelector<HTMLAudioElement>(".invitation-shell audio");
  const audioSource = audio?.querySelector<HTMLSourceElement>("source");
  if (audio && audioSource && settings.musicUrl !== undefined) {
    const targetUrl = typeof settings.musicUrl === "string" ? settings.musicUrl.trim() : "";
    if (!targetUrl) {
      // User selected "Tanpa musik"
      audio.pause();
      audio.currentTime = 0;
      audioSource.removeAttribute("src");
      audioSource.src = "";
      audio.load();
    } else if (audioSource.getAttribute("src") !== targetUrl) {
      audioSource.setAttribute("src", targetUrl);
      audio.load();
      if (document.querySelector<HTMLElement>("[data-template-scroll-root]")?.dataset.opened === "true") {
        void audio.play().catch(() => undefined);
      }
    }
  }
  if (audio && typeof settings.musicVolume === "number") {
    const vol = Math.max(0, Math.min(1, settings.musicVolume));
    audio.volume = vol;
    (window as unknown as { __weddingMusicVolume?: number }).__weddingMusicVolume = vol;
  }

  for (const section of sections) {
    const element = getWeddingSectionElement(section.type);
    if (!element) continue;
    element.style.display = section.enabled ? "" : "none";
    applySectionText(section, element);
    applySectionBackground(section, element);
    applyFieldFonts(section, element);
  }
}

export function watchWeddingTemplateState(sections: WeddingPreviewSection[], themeId: string, settings: WeddingGlobalSettings = {}) {
  let animationFrame = 0;
  const observer = new MutationObserver((mutations) => {
    const hasDynamicWeddingElement = mutations.some((mutation) => {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      if (target?.closest(".gallery-lightbox, .gift-section, .wishes-section")) return true;
      return Array.from(mutation.addedNodes).some((node) => node instanceof Element && (node.matches(".gallery-lightbox, .celebration, .empty-wishes, .wish-bubble") || node.querySelector(".gallery-lightbox, .celebration, .empty-wishes, .wish-bubble")));
    });
    if (!hasDynamicWeddingElement || animationFrame) return;
    animationFrame = window.requestAnimationFrame(() => {
      animationFrame = 0;
      applyWeddingTemplateState(sections, themeId, settings);
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    observer.disconnect();
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
  };
}
