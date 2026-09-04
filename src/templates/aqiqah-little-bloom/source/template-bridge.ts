export type AqiqahPreviewSection = {
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

export type AqiqahGlobalSettings = {
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
  manrope: "var(--font-manrope, 'Manrope', sans-serif)",
  "great-vibes": "'Great Vibes', cursive",
  "dancing-script": "'Dancing Script', cursive",
  cinzel: "'Cinzel', serif",
  cormorant: "'Cormorant Garamond', serif",
  amiri: "'Amiri', serif",
};

const palettes: Record<string, Record<string, string>> = {
  "pastel-sky": {
    "--aqiqah-bg": "#f0f5fb",
    "--aqiqah-surface": "#ffffff",
    "--aqiqah-primary": "#2b537d",
    "--aqiqah-accent": "#d4af37",
    "--aqiqah-text": "#1e334a",
    "--aqiqah-dark": "#14283d",
    "--aqiqah-rich": "#3b6999",
    "--aqiqah-mid": "#608bb8",
    "--aqiqah-cream": "#f7fafc",
    "--aqiqah-border": "#cfe0f0",
    "--aqiqah-muted": "#6685a5",
  },
  "blush-peach": {
    "--aqiqah-bg": "#fdf4f5",
    "--aqiqah-surface": "#ffffff",
    "--aqiqah-primary": "#8f4453",
    "--aqiqah-accent": "#d4af37",
    "--aqiqah-text": "#3d1f25",
    "--aqiqah-dark": "#2c1218",
    "--aqiqah-rich": "#b05d6e",
    "--aqiqah-mid": "#cf8694",
    "--aqiqah-cream": "#fff9fa",
    "--aqiqah-border": "#f3d1d7",
    "--aqiqah-muted": "#96656f",
  },
  "sage-meadow": {
    "--aqiqah-bg": "#f2f7f3",
    "--aqiqah-surface": "#ffffff",
    "--aqiqah-primary": "#355e42",
    "--aqiqah-accent": "#d9a74a",
    "--aqiqah-text": "#213628",
    "--aqiqah-dark": "#14241a",
    "--aqiqah-rich": "#4b7c5b",
    "--aqiqah-mid": "#76a384",
    "--aqiqah-cream": "#f8fbf8",
    "--aqiqah-border": "#d1e3d6",
    "--aqiqah-muted": "#66826e",
  },
};

const defaultTexts: Record<string, Record<string, string>> = {
  "opening-envelope": {
    kicker: "UNDANGAN TASYAKURAN AQIQAH",
    title: "Tasyakuran Aqiqah",
    subtitle: "Muhammad Rayyan Al-Fatih",
    date: "Ahad, 20 Desember 2026",
  },
  hero: {
    bismillah: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    kicker: "✦ TASYAKURAN WALIMATUL AQIQAH ✦",
    title: "Muhammad Rayyan Al-Fatih",
    nickname: "Baby Rayyan",
    date: "Ahad, 20 Desember 2026",
    copy: "Puji dan syukur kami panjatkan ke hadirat Allah SWT atas karunia dan amanah kelahiran putra kami tercinta.",
  },
  prayer: {
    arabic: "كُلُّ غُلاَمٍ رَهِينَةٌ بِعَقِيقَتِهِ تُذْبَحُ عَنْهُ يَوْمَ سَابِعِهِ وَيُحْلَقُ وَيُسَمَّى",
    translation: "Setiap anak tergadaikan dengan aqiqahnya, disembelihkan untuknya pada hari ketujuh, dicukur rambutnya, dan diberi nama.",
    source: "— HR. Abu Dawud, At-Tirmidzi, & An-Nasa'i",
  },
  profile: {
    eyebrow: "PUTRA TERCINTA KAMI",
    childName: "Muhammad Rayyan Al-Fatih",
    gender: "Putra Pertama",
    birthDate: "Senin, 07 Desember 2026",
    birthTime: "Pukul 06.45 WIB",
    birthWeight: "3.35 kg",
    birthHeight: "50 cm",
    parents: "Putra dari Bpk. Irfan Maulana & Ibu Annisa Wardani",
    doa: "Semoga Allah SWT menjadikan ananda anak yang sholeh, cerdas, berakhlak mulia, berbakti kepada kedua orang tua, serta menjadi penyejuk hati bagi keluarga dan umat.",
  },
  event: {
    eyebrow: "WAKTU & LOKASI",
    title: "Rangkaian Acara Tasyakuran",
    eventBadge: "Tasyakuran & Doa Bersama",
    eventTitle: "Walimatul Aqiqah & Potong Rambut",
    eventDate: "Ahad, 20 Desember 2026",
    eventTime: "Pukul 09.00 – 12.00 WIB",
    venueName: "Kediaman Keluarga Bpk. Irfan & Ibu Annisa",
    venueAddress: "Jl. Dahlia Indah No. 18, Kemang, Jakarta Selatan",
    mapLabel: "Buka Google Maps",
  },
  gallery: {
    eyebrow: "SWEET MOMENTS",
    title: "Galeri Buah Hati",
    description: "Potret kebahagiaan dan kehangatan menyambut kehadiran malaikat kecil kami.",
  },
  gift: {
    eyebrow: "HADIAH DIGITAL",
    title: "Tanda Kasih & Hadiah",
    description: "Doa restu Anda merupakan karunia terindah bagi kami. Bagi keluarga dan sahabat yang ingin memberikan tanda kasih untuk ananda, dapat melalui transfer berikut:",
    bank1Name: "BCA",
    bank1Account: "8830192847",
    bank1Holder: "Irfan Maulana",
    bank2Name: "Bank Syariah Indonesia (BSI)",
    bank2Account: "7128394012",
    bank2Holder: "Annisa Wardani",
    giftRecipient: "Keluarga Rayyan (0812-3456-7890)",
    giftAddress: "Jl. Dahlia Indah No. 18, Kemang, Jakarta Selatan (12730)",
  },
  wishes: {
    eyebrow: "GUESTBOOK",
    title: "Untaian Doa & Ucapan",
    description: "Tinggalkan doa dan pesan hangat untuk ananda Muhammad Rayyan Al-Fatih.",
  },
  closing: {
    eyebrow: "JAZAKUMULLAH KHAIRAN",
    title: "Terima Kasih",
    message: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu bagi putra kami tercinta.",
    family: "Keluarga Besar Irfan Maulana & Annisa Wardani",
  },
};

function applyTextStyle(el: HTMLElement, style?: TextStyle) {
  if (!style) {
    el.style.fontFamily = "";
    el.style.fontSize = "";
    el.style.color = "";
    el.style.fontWeight = "";
    el.style.fontStyle = "";
    return;
  }
  if (style.fontFamily && fontFamilies[style.fontFamily]) {
    el.style.fontFamily = fontFamilies[style.fontFamily];
  } else {
    el.style.fontFamily = "";
  }
  el.style.fontSize = style.fontSize ? `${style.fontSize}px` : "";
  el.style.color = style.color || "";
  el.style.fontWeight = style.bold ? "bold" : "";
  el.style.fontStyle = style.italic ? "italic" : "";
}

function applyMusic(settings?: AqiqahGlobalSettings) {
  const audio = document.querySelector<HTMLAudioElement>(".aqiqah-shell audio");
  const source = audio?.querySelector<HTMLSourceElement>("source");
  if (!audio || !source) return;

  const targetMusicUrl = typeof settings?.musicUrl === "string" ? settings.musicUrl.trim() : undefined;

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

  if (typeof settings?.musicVolume === "number") {
    audio.volume = Math.max(0, Math.min(1, settings.musicVolume));
  }
}

export function applyAqiqahTemplateState(
  sections: AqiqahPreviewSection[],
  themeId?: string,
  settings?: AqiqahGlobalSettings
) {
  const root = document.querySelector<HTMLElement>("[data-template-scroll-root]");
  const shell = document.querySelector<HTMLElement>(".aqiqah-shell") || document.documentElement;
  if (!root && !shell) return;

  // 1. Terapkan Tema & Warna
  const activePalette = palettes[themeId || "pastel-sky"] || palettes["pastel-sky"];
  Object.entries(activePalette).forEach(([key, val]) => {
    shell.style.setProperty(key, val);
  });

  if (settings?.customColors?.primary) {
    shell.style.setProperty("--aqiqah-primary", settings.customColors.primary);
  }
  if (settings?.customColors?.accent) {
    shell.style.setProperty("--aqiqah-accent", settings.customColors.accent);
  }
  if (settings?.customColors?.background) {
    shell.style.setProperty("--aqiqah-bg", settings.customColors.background);
  }

  // 2. Terapkan Audio Settings
  applyMusic(settings);

  // 2.5 Terapkan Container Mode (Mobile 480px vs Desktop Full Width)
  shell.setAttribute("data-use-container", settings?.useContainer === false ? "false" : "true");

  // 3. Terapkan Setiap Section
  sections.forEach((section) => {
    const node = document.querySelector<HTMLElement>(`[data-template-section="${section.type}"]`);
    if (!node) return;

    // Handle Enable/Disable dengan !important display: none & [hidden]
    if (section.enabled === false) {
      node.style.setProperty("display", "none", "important");
      node.setAttribute("hidden", "true");
      return;
    } else {
      node.style.removeProperty("display");
      node.removeAttribute("hidden");
    }

    // Handle Background Color jika diubah di inspector
    if (typeof section.data?.backgroundColor === "string" && section.data.backgroundColor) {
      node.style.backgroundColor = section.data.backgroundColor;
    } else {
      node.style.backgroundColor = "";
    }

    // Handle Text Styles
    const textStyles = (section.data?.textStyles as Record<string, TextStyle>) || {};

    // Handle fields dengan fallback aman
    const defaults = defaultTexts[section.type] || {};
    Object.keys(defaults).forEach((key) => {
      const fieldEl = node.querySelector<HTMLElement>(`[data-field="${key}"]`);
      if (fieldEl) {
        const val = section.data?.[key];
        fieldEl.textContent = typeof val === "string" && val.trim() !== "" ? val : defaults[key];
        applyTextStyle(fieldEl, textStyles[key]);
      }
    });

    // Handle Image tunggal (Hero / Profile)
    if (section.type === "hero" || section.type === "profile") {
      const imgEl = node.querySelector<HTMLImageElement>("img[data-field-image]");
      const avatarBox = node.querySelector<HTMLElement>("[data-avatar-box]");
      const fallbackUrl =
        section.type === "hero"
          ? "/assets/aqiqah/baby-portrait.png"
          : "/assets/aqiqah/baby-landscape.png";
      const targetSrc =
        typeof section.data?.imageUrl === "string" && section.data.imageUrl.trim() !== ""
          ? section.data.imageUrl
          : fallbackUrl;
      if (imgEl) {
        imgEl.src = targetSrc;
        imgEl.style.display = "block";
        if (avatarBox) avatarBox.style.display = "none";
      }
    }

    // Handle Google Maps
    if (section.type === "event" && typeof section.data?.mapUrl === "string") {
      const mapLink = node.querySelector<HTMLAnchorElement>("[data-map-link]");
      if (mapLink) {
        mapLink.href = section.data.mapUrl || "https://maps.google.com";
      }
    }

    // Handle Gallery Images
    if (section.type === "gallery" && Array.isArray(section.data?.imageUrls)) {
      window.dispatchEvent(
        new CustomEvent("aqiqah-gallery-update", {
          detail: { urls: section.data.imageUrls },
        })
      );
    }
  });
}

export function watchAqiqahTemplateState(
  sections: AqiqahPreviewSection[],
  themeId?: string,
  settings?: AqiqahGlobalSettings
) {
  applyAqiqahTemplateState(sections, themeId, settings);
  return () => {
    // Cleanup if needed
  };
}
