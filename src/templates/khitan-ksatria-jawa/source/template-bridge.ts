export type KhitanPreviewSection = {
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

type KhitanSettings = {
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
  manrope: "var(--font-manrope, 'Manrope', sans-serif)",
  "great-vibes": "'Great Vibes', cursive",
  "dancing-script": "'Dancing Script', cursive",
  amiri: "'Amiri', serif",
};

const palettes: Record<string, Record<string, string>> = {
  "keraton-emerald": {
    "--khitan-bg": "#faf7f0",
    "--khitan-surface": "#ffffff",
    "--khitan-primary": "#1b382b",
    "--khitan-accent": "#d4af37",
    "--khitan-text": "#202d24",
    "--khitan-dark": "#0e1f17",
    "--khitan-rich": "#2d4a3b",
    "--khitan-mid": "#517460",
    "--khitan-cream": "#f7f1e1",
    "--khitan-border": "#dcd1ba",
    "--khitan-muted": "#6b7c71",
  },
  "midnight-navy": {
    "--khitan-bg": "#f4f6fa",
    "--khitan-surface": "#ffffff",
    "--khitan-primary": "#16213e",
    "--khitan-accent": "#e5b95c",
    "--khitan-text": "#1e293b",
    "--khitan-dark": "#0f172a",
    "--khitan-rich": "#1e2d4d",
    "--khitan-mid": "#3b4f73",
    "--khitan-cream": "#f8f5eb",
    "--khitan-border": "#cbd5e1",
    "--khitan-muted": "#64748b",
  },
  "sogan-terracotta": {
    "--khitan-bg": "#fbf8f3",
    "--khitan-surface": "#ffffff",
    "--khitan-primary": "#5c3d2e",
    "--khitan-accent": "#d99b38",
    "--khitan-text": "#362217",
    "--khitan-dark": "#2b1810",
    "--khitan-rich": "#48281b",
    "--khitan-mid": "#805943",
    "--khitan-cream": "#f5ecdb",
    "--khitan-border": "#dfd2c0",
    "--khitan-muted": "#7c685b",
  },
};

const defaultTexts: Record<string, Record<string, string>> = {
  "opening-envelope": {
    kicker: "UNDANGAN WALIMATUL KHITAN",
    title: "Walimatul Khitan",
    subtitle: "Raden Mas Arya Pratama",
    date: "Ahad, 15 November 2026",
  },
  hero: {
    bismillah: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    kicker: "✦ WALIMATUL KHITAN ✦",
    title: "Raden Mas Arya Pratama",
    date: "Ahad, 15 November 2026",
    copy: "Menunaikan Sunnah Rasulullah SAW demi Menjadi Generasi Shalih, Berbakti, dan Budi Pekerti Mulia.",
  },
  profile: {
    eyebrow: "SANG KSATRIA KELUARGA",
    title: "Profil Ananda Tercinta",
    childName: "Raden Mas Arya Pratama",
    nickname: "Ananda Arya",
    parents: "Putra Pertama dari Bpk. Bambang Wijaya & Ibu Siti Rahayu",
    familyNote: "Mendampingi ananda tercinta dalam balutan busana adat ageng Keraton Jawa penuh doa dan restu.",
    doa: "Semoga Allah SWT senantiasa melimpahkan taufik, hidayah, dan kesehatan, menjadikannya anak yang sholeh, berbakti kepada kedua orang tua, cerdas berakhlak, serta berguna bagi nusa, bangsa, dan agama.",
  },
  event: {
    eyebrow: "WAKTU & LOKASI SYUKURAN",
    title: "Rangkaian Acara Khitanan",
    eventBadge: "Syukuran Khitan",
    eventTitle: "Doa Syukuran Khitan",
    eventTime: "Pukul 08.30 – 11.30 WIB",
    locationName: "Gedung Sasana Kriya Keraton",
    address: "Jl. Pangeran Antasari No. 88, Kedamaian, Kota Bandar Lampung",
    mapLabel: "Buka Google Maps",
    calendarLabel: "Simpan ke Kalender",
  },
  gallery: {
    eyebrow: "ALBUM KENANGAN",
    title: "Galeri Sang Ksatria",
    subtitle: "Senyum, wibawa, dan langkah awal kedewasaan Ananda Arya.",
  },
  gift: {
    eyebrow: "TANDA KASIH & DOA",
    title: "Kirim Hadiah Digital",
    subtitle: "Kehadiran dan doa restu Bapak/Ibu/Saudara/i merupakan kebahagiaan tak terhingga bagi kami. Apabila berkenan memberikan tanda kasih bagi Ananda Arya, dapat melalui:",
    bank: "BANK BCA",
    account: "7820 1829 90",
    holder: "a.n. Bambang Wijaya (Ayah)",
    bank2: "BANK MANDIRI",
    account2: "1140 0293 8472 1",
    holder2: "a.n. Siti Rahayu (Ibu)",
    qrisLabel: "Scan QRIS Tanda Kasih",
  },
  wishes: {
    eyebrow: "UNTAIAN DOA RESTU",
    title: "Buku Tamu & Ucapan",
    subtitle: "Tuliskan doa serta pesan hangat Anda untuk mengiringi langkah Ananda Arya.",
  },
  closing: {
    eyebrow: "JAZAKUMULLAH KHAIRAN KATSIRAN",
    title: "Matur Nuwun",
    subtitle: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu bagi Ananda tercinta.",
    family: "Keluarga Besar Bpk. Bambang Wijaya & Ibu Siti Rahayu",
  },
};

function applyMusic(settings: KhitanSettings) {
  const audio = document.querySelector<HTMLAudioElement>(".khitan-shell audio");
  const source = audio?.querySelector<HTMLSourceElement>("source");
  if (!audio || !source) return;

  const targetMusicUrl = typeof settings.musicUrl === "string" ? settings.musicUrl.trim() : undefined;

  if (targetMusicUrl !== undefined) {
    if (!targetMusicUrl) {
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
    target.style.fontWeight = style.bold ? "bold" : "";
    target.style.fontStyle = style.italic ? "italic" : "";
  });
}

export function updateKhitanPreview(
  sections: KhitanPreviewSection[],
  themeId = "keraton-emerald",
  settings: KhitanSettings = {}
) {
  const root = document.querySelector<HTMLElement>(".khitan-shell");
  if (!root) return;

  const activePalette = palettes[themeId] ?? palettes["keraton-emerald"];
  Object.entries(activePalette).forEach(([cssVar, val]) => {
    root.style.setProperty(cssVar, val);
  });

  if (settings.customColors?.primary) {
    root.style.setProperty("--khitan-primary", settings.customColors.primary);
    root.style.setProperty("--khitan-rich", settings.customColors.primary);
  }
  if (settings.customColors?.accent) {
    root.style.setProperty("--khitan-accent", settings.customColors.accent);
  }
  if (settings.customColors?.background) {
    root.style.setProperty("--khitan-bg", settings.customColors.background);
    root.style.setProperty("--khitan-surface", "#ffffff");
  }

  applyMusic(settings);

  const shell = document.querySelector<HTMLElement>(".khitan-shell");
  if (shell) {
    shell.setAttribute("data-use-container", settings.useContainer === false ? "false" : "true");
  }

  sections.forEach((section) => {
    const node = root.querySelector<HTMLElement>(`[data-template-section="${section.type}"]`);
    if (!node) return;

    if (!section.enabled) {
      node.style.setProperty("display", "none", "important");
      node.toggleAttribute("hidden", true);
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

    if (typeof section.data.imageUrl === "string" && section.data.imageUrl.trim()) {
      let targetUrl = section.data.imageUrl.trim();
      if (section.type === "profile" && targetUrl === "/assets/khitanan/2.jpeg") {
        targetUrl = "/assets/khitanan/7.jpeg";
      }
      const img = node.querySelector<HTMLImageElement>("img[data-single-img]");
      if (img) img.src = targetUrl;
    }

    if (section.type === "event") {
      if (typeof section.data.event1Title === "string" && !section.data.eventTitle) {
        section.data.eventTitle = section.data.event1Title;
      }
      if (typeof section.data.event1Time === "string" && !section.data.eventTime) {
        section.data.eventTime = section.data.event1Time;
      }
      if (typeof section.data.mapUrl === "string") {
        const link = node.querySelector<HTMLAnchorElement>("[data-map-link]");
        if (link) link.href = section.data.mapUrl;
      }
      if (typeof section.data.calendarUrl === "string") {
        const calLink = node.querySelector<HTMLAnchorElement>("[data-calendar-link]");
        if (calLink) calLink.href = section.data.calendarUrl;
      }
    }

    if (section.type === "gallery" && Array.isArray(section.data.imageUrls)) {
      window.dispatchEvent(
        new CustomEvent("khitan-gallery-update", {
          detail: { urls: section.data.imageUrls as string[] },
        })
      );
    }

    applyTextStyles(node, section.data.textStyles as Record<string, TextStyle> | undefined);
  });
}

export function applyKhitanTemplateState(
  sections: KhitanPreviewSection[],
  themeId = "keraton-emerald",
  settings: KhitanSettings = {}
) {
  updateKhitanPreview(sections, themeId, settings);
}

export function watchKhitanTemplateState(
  sections: KhitanPreviewSection[],
  themeId = "keraton-emerald",
  settings: KhitanSettings = {}
) {
  applyKhitanTemplateState(sections, themeId, settings);
  return () => {};
}
