export type WisudaPreviewSection = {
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

export type WisudaSettings = {
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

const fontFamilies: Record<string, string> = {
  cinzel: "'Cinzel', serif",
  cormorant: "'Cormorant Garamond', serif",
  outfit: "'Outfit', sans-serif",
  manrope: "var(--font-manrope, 'Manrope', sans-serif)",
  "great-vibes": "'Great Vibes', cursive",
  "dancing-script": "'Dancing Script', cursive",
};

const palettes: Record<string, Record<string, string>> = {
  "festive-celebration": {
    "--wisuda-bg": "#f8fafc",
    "--wisuda-surface": "#ffffff",
    "--wisuda-primary": "#1e1b4b",
    "--wisuda-accent": "#6366f1",
    "--wisuda-text": "#0f172a",
    "--wisuda-dark": "#0f172a",
    "--wisuda-rich": "#1e1b4b",
    "--wisuda-mid": "#334155",
    "--wisuda-cream": "#f1f5f9",
    "--wisuda-border": "#e2e8f0",
    "--wisuda-muted": "#64748b",
  },
  "vibrant-violet": {
    "--wisuda-bg": "#faf5ff",
    "--wisuda-surface": "#ffffff",
    "--wisuda-primary": "#3b0764",
    "--wisuda-accent": "#ec4899",
    "--wisuda-text": "#0f172a",
    "--wisuda-dark": "#1e1b4b",
    "--wisuda-rich": "#2e1065",
    "--wisuda-mid": "#334155",
    "--wisuda-cream": "#fdf4ff",
    "--wisuda-border": "#e9d5ff",
    "--wisuda-muted": "#64748b",
  },
  "ocean-cyan": {
    "--wisuda-bg": "#f0f9ff",
    "--wisuda-surface": "#ffffff",
    "--wisuda-primary": "#0c4a6e",
    "--wisuda-accent": "#06b6d4",
    "--wisuda-text": "#0f172a",
    "--wisuda-dark": "#082f49",
    "--wisuda-rich": "#075985",
    "--wisuda-mid": "#334155",
    "--wisuda-cream": "#e0f2fe",
    "--wisuda-border": "#bae6fd",
    "--wisuda-muted": "#64748b",
  },
  "emerald-gold": {
    "--wisuda-bg": "#f0fdf4",
    "--wisuda-surface": "#ffffff",
    "--wisuda-primary": "#064e3b",
    "--wisuda-accent": "#d97706",
    "--wisuda-text": "#064e3b",
    "--wisuda-dark": "#022c22",
    "--wisuda-rich": "#047857",
    "--wisuda-mid": "#1e293b",
    "--wisuda-cream": "#ecfdf5",
    "--wisuda-border": "#a7f3d0",
    "--wisuda-muted": "#64748b",
  },
};

const defaultTexts: Record<string, Record<string, string>> = {
  "opening-envelope": {
    title: "Undangan Wisuda",
    graduateName: "Anindya Putri Rahayu, S.Kom",
    university: "Universitas Indonesia",
    subtitle: "Spesial mengundang Bapak/Ibu/Sahabat:",
    buttonLabel: "Buka Undangan",
  },
  hero: {
    kicker: "🎉 Momen Kelulusan & Selebrasi 🎉",
    title: "Perayaan Kelulusan & Wisuda",
    graduateName: "Anindya Putri Rahayu",
    degree: "S.Kom",
    university: "Universitas Indonesia",
    faculty: "Fakultas Ilmu Komputer · Sistem Informasi",
    date: "Sabtu, 17 Oktober 2026",
    scrollHint: "Gulir ke bawah untuk info selengkapnya",
  },
  quote: {
    title: "Ungkapan Syukur & Apresiasi",
    quoteText: "Tiada capaian terindah tanpa doa tulus orang tua, bimbingan para dosen tercinta, dan kebersamaan keluarga serta sahabat. Hari kelulusan ini adalah awal dari langkah baru menuju masa depan yang penuh berkah.",
    author: "Anindya Putri Rahayu, S.Kom",
  },
  profile: {
    title: "Profil Wisudawati",
    graduateName: "Anindya Putri Rahayu, S.Kom",
    degree: "Sarjana Komputer (S.Kom)",
    university: "Universitas Indonesia",
    faculty: "Fakultas Ilmu Komputer",
    major: "Program Studi Sistem Informasi",
    period: "Wisuda Program Sarjana Periode Genap 2025/2026",
  },
  event: {
    title: "Rangkaian Acara",
    subtitle: "Jadwal prosesi upacara kelulusan wisuda",
    ceremonyName: "Upacara Wisuda",
    ceremonyTime: "08.00 - 11.30 WIB",
    ceremonyVenue: "Balairung Utama Universitas Indonesia, Depok",
    ceremonyMapLabel: "Buka Google Maps",
    mapLabel: "Buka Google Maps",
    calendarLabel: "Simpan ke Kalender",
  },
  gallery: {
    title: "Momen & Kenangan",
    subtitle: "Kenangan indah selama masa studi hingga hari kelulusan yang membanggakan",
  },
  wishes: {
    title: "Kirim Ucapan & Doa",
    subtitle: "Tinggalkan ucapan selamat dan doa terbaik untuk kelulusan wisudawati",
  },
  closing: {
    title: "Terima Kasih",
    message: "Merupakan suatu kehormatan dan kebahagiaan bagi kami sekeluarga atas kehadiran, dukungan, dan ucapan tulus dari Bapak/Ibu/Saudara/i sekalian.",
    familySignature: "Anindya Putri Rahayu, S.Kom & Keluarga Besar",
  },
};

function applyTextStyles(node: HTMLElement, styles?: Record<string, TextStyle>) {
  if (!styles || typeof styles !== "object") return;
  Object.entries(styles).forEach(([key, style]) => {
    if (!style) return;
    const target = node.querySelector<HTMLElement>(`[data-field="${key}"]`);
    if (!target) return;
    if (style.fontFamily && fontFamilies[style.fontFamily]) {
      target.style.fontFamily = fontFamilies[style.fontFamily];
    } else if (style.fontFamily) {
      target.style.fontFamily = style.fontFamily;
    }
    if (typeof style.fontSize === "number") {
      target.style.fontSize = `${style.fontSize}px`;
    }
    if (style.color) {
      target.style.color = style.color;
    }
    if (typeof style.bold === "boolean") {
      target.style.fontWeight = style.bold ? "700" : "400";
    }
    if (typeof style.italic === "boolean") {
      target.style.fontStyle = style.italic ? "italic" : "normal";
    }
  });
}

export function updateWisudaPreview(
  sections: WisudaPreviewSection[],
  themeId = "festive-celebration",
  settings: WisudaSettings = {}
) {
  if (typeof document === "undefined") return;

  const shell = document.querySelector<HTMLElement>(".wisuda-shell");
  if (shell) {
    shell.setAttribute("data-use-container", settings.useContainer === false ? "false" : "true");
  }

  // Apply color palette tokens
  const palette = palettes[themeId] || palettes["festive-celebration"];
  Object.entries(palette).forEach(([token, value]) => {
    document.documentElement.style.setProperty(token, value);
    if (shell) shell.style.setProperty(token, value);
  });

  // Apply custom color overrides
  if (settings.customColors) {
    if (settings.customColors.primary) {
      document.documentElement.style.setProperty("--wisuda-primary", settings.customColors.primary);
      document.documentElement.style.setProperty("--wisuda-dark", settings.customColors.primary);
      if (shell) {
        shell.style.setProperty("--wisuda-primary", settings.customColors.primary);
        shell.style.setProperty("--wisuda-dark", settings.customColors.primary);
      }
    }
    if (settings.customColors.accent) {
      document.documentElement.style.setProperty("--wisuda-accent", settings.customColors.accent);
      if (shell) shell.style.setProperty("--wisuda-accent", settings.customColors.accent);
    }
    if (settings.customColors.background) {
      document.documentElement.style.setProperty("--wisuda-bg", settings.customColors.background);
      if (shell) shell.style.setProperty("--wisuda-bg", settings.customColors.background);
    }
  }

  // Audio configuration
  const audio = document.querySelector<HTMLAudioElement>(".wisuda-shell audio");
  const source = audio?.querySelector("source");
  if (audio && source && settings.musicUrl && source.src !== settings.musicUrl) {
    source.src = settings.musicUrl;
    audio.load();
  }
  if (audio && typeof settings.musicVolume === "number") {
    audio.volume = Math.max(0, Math.min(1, settings.musicVolume));
  }

  // Process sections
  sections.forEach((section) => {
    const node = document.querySelector<HTMLElement>(`[data-template-section="${section.type}"]`);
    if (!node) return;

    if (!section.enabled) {
      node.style.setProperty("display", "none", "important");
      node.setAttribute("hidden", "true");
      node.classList.add("is-hidden");
      return;
    }

    node.style.removeProperty("display");
    node.removeAttribute("hidden");
    node.classList.remove("is-hidden");

    if (typeof section.data.backgroundColor === "string" && section.data.backgroundColor.trim()) {
      node.style.backgroundColor = section.data.backgroundColor.trim();
    } else {
      node.style.removeProperty("background-color");
    }

    if (typeof section.data.backgroundImageUrl === "string" && section.data.backgroundImageUrl.trim()) {
      node.style.backgroundImage = `url("${section.data.backgroundImageUrl.trim()}")`;
      node.style.backgroundSize = "cover";
      node.style.backgroundPosition = "center";
    } else {
      node.style.removeProperty("background-image");
      node.style.removeProperty("background-size");
      node.style.removeProperty("background-position");
    }

    // Apply text fields
    const fieldElements = Array.from(node.querySelectorAll<HTMLElement>("[data-field]"));
    fieldElements.forEach((el) => {
      const key = el.dataset.field;
      if (!key) return;
      const val = section.data[key];
      if (typeof val === "string" && val.trim()) {
        el.textContent = val.trim();
      } else {
        const fallback = defaultTexts[section.type]?.[key] ?? "";
        el.textContent = fallback;
      }
    });

    // Apply single images (e.g. hero photo, profile photo)
    const singleImg = node.querySelector<HTMLImageElement>("img[data-single-img]");
    const heroEmpty = node.querySelector<HTMLElement>("[data-single-img-empty]");
    const avatarEmpty = node.querySelector<HTMLElement>("[data-profile-avatar-empty]");

    if (typeof section.data.photoUrl === "string" && section.data.photoUrl.trim()) {
      if (singleImg) {
        singleImg.src = section.data.photoUrl.trim();
        singleImg.style.display = "block";
      }
      if (heroEmpty) heroEmpty.style.display = "none";
      if (avatarEmpty) avatarEmpty.style.display = "none";
    } else {
      if (singleImg) {
        singleImg.src = "";
        singleImg.style.display = "none";
      }
      if (heroEmpty) heroEmpty.style.display = "flex";
      if (avatarEmpty) avatarEmpty.style.display = "flex";
    }

    if (typeof section.data.sealImage === "string" && section.data.sealImage.trim()) {
      const sealImg = node.querySelector<HTMLImageElement>("img[data-seal-img]");
      if (sealImg) sealImg.src = section.data.sealImage.trim();
    }

    // Event section: map links & calendar link
    if (section.type === "event") {
      if (typeof section.data.ceremonyMapUrl === "string") {
        const ceremonyMap = node.querySelector<HTMLAnchorElement>("[data-ceremony-map-link]");
        if (ceremonyMap) ceremonyMap.href = section.data.ceremonyMapUrl;
      }
      if (typeof section.data.mapUrl === "string") {
        const mapLink = node.querySelector<HTMLAnchorElement>("[data-reception-map-link], [data-map-link]");
        if (mapLink) mapLink.href = section.data.mapUrl;
      }
      if (typeof section.data.calendarUrl === "string") {
        const calLink = node.querySelector<HTMLAnchorElement>("[data-calendar-link]");
        if (calLink) calLink.href = section.data.calendarUrl;
      }
    }

    // Gallery section: broadcast update event
    if (section.type === "gallery") {
      const urls = Array.isArray(section.data.imageUrls) ? (section.data.imageUrls as string[]) : [];
      window.dispatchEvent(
        new CustomEvent("wisuda-gallery-update", {
          detail: { urls },
        })
      );
    }

    applyTextStyles(node, section.data.textStyles as Record<string, TextStyle> | undefined);
  });
}

export function applyWisudaTemplateState(
  sections: WisudaPreviewSection[],
  themeId = "navy-gold",
  settings: WisudaSettings = {}
) {
  updateWisudaPreview(sections, themeId, settings);
}

export function watchWisudaTemplateState(
  sections: WisudaPreviewSection[],
  themeId = "navy-gold",
  settings: WisudaSettings = {}
) {
  applyWisudaTemplateState(sections, themeId, settings);
  return () => {};
}
