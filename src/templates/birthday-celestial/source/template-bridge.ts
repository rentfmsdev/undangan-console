export type BirthdayPreviewSection = { type: string; enabled: boolean; data: Record<string, unknown> };

type BirthdaySettings = {
  customColors?: { primary?: string; accent?: string; background?: string };
  musicUrl?: string;
  musicVolume?: number;
};

type TextStyle = {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
};

const fontFamilies: Record<string, string> = {
  "great-vibes": "var(--font-great-vibes, 'Great Vibes', cursive)",
  "dancing-script": "var(--font-dancing-script, 'Dancing Script', cursive)",
  cormorant: "var(--font-cormorant, 'Cormorant Garamond', serif)",
  manrope: "var(--font-manrope, 'Manrope', sans-serif)",
};

const palettes: Record<string, Record<string, string>> = {
  "midnight-lilac": { "--p": "#5b3f88", "--a": "#efb94f", "--bg": "#f8f5ff", "--surface": "#ffffff", "--dark": "#201637", "--rich": "#38245e", "--text": "#30254b", "--muted": "#766d91" },
  "sunset-peach": { "--p": "#ad5268", "--a": "#e89a4d", "--bg": "#fff7f3", "--surface": "#fffdfb", "--dark": "#48212e", "--rich": "#753547", "--text": "#4d2832", "--muted": "#8d6972" },
  "sky-mint": { "--p": "#357b78", "--a": "#e0a44a", "--bg": "#f2fbfa", "--surface": "#ffffff", "--dark": "#173c3b", "--rich": "#265e5b", "--text": "#214846", "--muted": "#66817e" },
};

const defaultTexts: Record<string, Record<string, string>> = {
  "opening-envelope": { title: "Naya Turns 17", subtitle: "18 · 10 · 2026" },
  hero: {
    kicker: "✦ HAPPY SWEET 17TH ✦",
    title: "Happy Birthday, Naya!",
    subtitle: "Sabtu, 18 Oktober 2026",
    guestLabel: "Kepada Yth.",
    copy: "Mari rayakan hari istimewa ini bersama-sama.",
  },
  event: { title: "Birthday Party", subtitle: "16.00 WIB sampai selesai", address: "Sky Garden, Bandar Lampung", mapLabel: "Buka Google Maps" },
  gallery: { title: "Little Moments", subtitle: "Senyum, tawa, dan kenangan." },
  gift: { eyebrow: "A LITTLE GIFT", title: "Kirim Hadiah", subtitle: "Kehadiran dan doa terbaikmu sudah sangat berarti. Jika berkenan, hadiah digital dapat dikirim melalui berikut ini.", bank: "BANK BCA", account: "1234 5678 90", holder: "a.n. Naya Putri", bank2: "BANK BNI", account2: "", holder2: "", copyLabel: "Salin nomor", qrisLabel: "Scan QRIS" },
  wishes: { title: "Kirim Ucapan", subtitle: "Doa terbaikmu adalah hadiah yang paling berarti." },
  closing: { title: "See You at the Party!", subtitle: "Terima kasih sudah menjadi bagian dari hari bahagia ini." },
};

function applyMusic(settings: BirthdaySettings) {
  const audio = document.querySelector<HTMLAudioElement>(".birthday-shell audio");
  const source = audio?.querySelector<HTMLSourceElement>("source");
  if (!audio || !source) return;

  const targetMusicUrl = typeof settings.musicUrl === "string" ? settings.musicUrl.trim() : undefined;

  if (targetMusicUrl !== undefined) {
    if (!targetMusicUrl) {
      // User selected "Tanpa musik"
      audio.pause();
      audio.currentTime = 0;
      source.removeAttribute("src");
      source.src = "";
      audio.load();
      return;
    }

    const resolvedUrl = new URL(targetMusicUrl, window.location.href).href;
    if (source.src !== resolvedUrl) {
      source.src = targetMusicUrl;
      audio.load();
      if (document.querySelector<HTMLElement>("[data-template-scroll-root]")?.dataset.opened === "true") {
        void audio.play().catch(() => undefined);
      }
    }
  }

  if (typeof settings.musicVolume === "number") {
    audio.volume = Math.max(0, Math.min(1, settings.musicVolume));
  }
}

function applyTextStyles(node: HTMLElement, textStyles?: Record<string, TextStyle>) {
  if (!textStyles || typeof textStyles !== "object") return;
  Object.entries(textStyles).forEach(([fieldKey, style]) => {
    if (!style || typeof style !== "object") return;
    const target = node.querySelector<HTMLElement>(`[data-field="${fieldKey}"]`);
    if (!target) return;
    if (style.fontFamily && fontFamilies[style.fontFamily]) {
      target.style.fontFamily = fontFamilies[style.fontFamily];
    } else if (style.fontFamily === "template" || !style.fontFamily) {
      target.style.fontFamily = "";
    }
    if (typeof style.fontSize === "number" && style.fontSize > 0) {
      target.style.fontSize = `${style.fontSize}px`;
    } else {
      target.style.fontSize = "";
    }
    if (style.color) {
      target.style.color = style.color;
      target.style.webkitTextFillColor = style.color;
    } else {
      target.style.color = "";
      target.style.webkitTextFillColor = "";
    }
    if (typeof style.bold === "boolean") {
      target.style.fontWeight = style.bold ? "700" : "400";
    }
    if (typeof style.italic === "boolean") {
      target.style.fontStyle = style.italic ? "italic" : "normal";
    }
  });
}

export function applyBirthdayTemplateState(sections: BirthdayPreviewSection[], themeId: string, settings: BirthdaySettings = {}) {
  const root = document.documentElement;
  Object.entries(palettes[themeId] ?? palettes["midnight-lilac"]).forEach(([key, value]) => root.style.setProperty(key, value));
  if (settings.customColors?.primary) {
    root.style.setProperty("--p", settings.customColors.primary);
    root.style.setProperty("--rich", `color-mix(in srgb, ${settings.customColors.primary} 74%, black)`);
  }
  if (settings.customColors?.accent) root.style.setProperty("--a", settings.customColors.accent);
  if (settings.customColors?.background) root.style.setProperty("--bg", settings.customColors.background);
  applyMusic(settings);

  sections.forEach((section) => {
    const node = document.querySelector<HTMLElement>(`[data-template-section="${section.type}"]`);
    if (!node) return;
    if (section.enabled) {
      node.style.removeProperty("display");
      node.removeAttribute("hidden");
      node.classList.remove("is-hidden");
    } else {
      node.style.setProperty("display", "none", "important");
      node.setAttribute("hidden", "");
      node.classList.add("is-hidden");
    }

    // Background color capability
    if (typeof section.data.backgroundColor === "string" && section.data.backgroundColor.trim()) {
      node.style.backgroundColor = section.data.backgroundColor.trim();
    } else {
      node.style.backgroundColor = "";
    }

    // Background image capability
    const bgUrl = typeof section.data.backgroundImageUrl === "string" ? section.data.backgroundImageUrl.trim() : "";
    if (bgUrl) {
      node.style.backgroundImage = `url("${bgUrl.replace(/"/g, "\\\"")}")`;
      node.style.backgroundSize = "cover";
      node.style.backgroundPosition = "center";
    } else {
      node.style.backgroundImage = "";
      node.style.backgroundSize = "";
      node.style.backgroundPosition = "";
    }

    // Apply text fields with non-empty fallbacks
    const defaults = defaultTexts[section.type] ?? {};
    Object.entries(section.data).forEach(([key, value]) => {
      const target = node.querySelector<HTMLElement>(`[data-field="${key}"]`);
      if (target && typeof value === "string") {
        const trimmed = value.trim();
        target.textContent = trimmed ? value : (defaults[key] ?? "");
      }
    });

    if (section.type === "opening-envelope") {
      const h1 = node.querySelector("h1");
      const sub = node.querySelector("h1 + span");
      if (h1 && typeof section.data.title === "string") {
        h1.textContent = section.data.title.trim() || defaults.title;
      }
      if (sub && typeof section.data.subtitle === "string") {
        sub.textContent = section.data.subtitle.trim() || defaults.subtitle;
      }
    }

    if (section.type === "hero") {
      const photo = node.querySelector<HTMLElement>(".birthday-hero-photo");
      const imageUrl = typeof section.data.imageUrl === "string" ? section.data.imageUrl.trim() : "";
      if (photo) {
        if (imageUrl) {
          photo.style.backgroundImage = `url("${imageUrl.replace(/"/g, "\\\"")}")`;
          photo.classList.add("has-image");
        } else {
          photo.style.backgroundImage = "";
          photo.classList.remove("has-image");
        }
      }
    }

    if (section.type === "gallery") {
      const imageUrls = Array.isArray(section.data.imageUrls)
        ? section.data.imageUrls.filter((url): url is string => typeof url === "string" && Boolean(url.trim())).slice(0, 4)
        : [];

      window.dispatchEvent(new CustomEvent("birthday-gallery-update", { detail: { imageUrls } }));

      const grid = node.querySelector<HTMLElement>(".birthday-gallery-grid");
      if (grid) {
        const cards = grid.querySelectorAll<HTMLElement>(".birthday-polaroid-card");
        cards.forEach((card, idx) => {
          const imgWrap = card.querySelector<HTMLElement>(".birthday-polaroid-img-wrap");
          const placeholder = card.querySelector<HTMLElement>(".birthday-gallery-placeholder");
          let img = card.querySelector<HTMLImageElement>("img.birthday-polaroid-img");
          const url = imageUrls[idx];
          if (url && imgWrap) {
            if (!img) {
              img = document.createElement("img");
              img.className = "birthday-polaroid-img";
              img.alt = `Kenangan ${idx + 1}`;
              imgWrap.prepend(img);
            }
            img.src = url;
            img.style.display = "block";
            if (placeholder) placeholder.style.display = "none";
          } else {
            if (img) img.style.display = "none";
            if (placeholder) placeholder.style.display = "grid";
          }
        });
      }
    }

    if (section.type === "gift") {
      const bankArea = node.querySelector<HTMLElement>("[data-gift-bank-area]");
      if (bankArea) bankArea.hidden = section.data.showBank === false;
      const secondAccount = node.querySelector<HTMLElement>("[data-gift-second-account]");
      if (secondAccount) secondAccount.hidden = section.data.showBank === false || section.data.hasSecondAccount !== true;
      const qrisArea = node.querySelector<HTMLElement>("[data-gift-qris-area]");
      if (qrisArea) qrisArea.hidden = section.data.showQris === false;
      const imageUrl = typeof section.data.imageUrl === "string" ? section.data.imageUrl.trim() : "";
      const qrisImage = node.querySelector<HTMLImageElement>("[data-gift-qris]");
      const placeholder = node.querySelector<HTMLElement>("[data-gift-qris-placeholder]");
      if (qrisImage) {
        if (imageUrl) {
          qrisImage.src = imageUrl;
          qrisImage.hidden = false;
          if (placeholder) placeholder.hidden = true;
        } else {
          qrisImage.removeAttribute("src");
          qrisImage.hidden = true;
          if (placeholder) placeholder.hidden = false;
        }
      }
    }

    if (section.type === "event" && typeof section.data.mapUrl === "string") {
      node.querySelector<HTMLAnchorElement>("[data-map-link]")?.setAttribute("href", section.data.mapUrl);
    }

    // Text style capability
    applyTextStyles(node, section.data.textStyles as Record<string, TextStyle> | undefined);
  });
}

export function watchBirthdayTemplateState(sections: BirthdayPreviewSection[], themeId: string, settings: BirthdaySettings = {}) {
  applyBirthdayTemplateState(sections, themeId, settings);
  return () => {};
}
