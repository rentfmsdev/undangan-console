"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import "./aqiqah.css";
import { AqiqahConfetti, type ConfettiHandle } from "./AqiqahConfetti";
import { AqiqahFloralPetals } from "./AqiqahFloralPetals";
import {
  AqiqahFrameWreath,
  AqiqahCornerFloral,
  AqiqahBabyBlocks,
  AqiqahWaxSeal,
  AqiqahEnvelopeFlap,
} from "./AqiqahFloralDecor";
import { AqiqahGallery } from "./AqiqahGallery";
import {
  TemplateNavigationRuntime,
  TEMPLATE_ACTIVE_EVENT,
  TEMPLATE_NAVIGATE_EVENT,
} from "@/templates/navigation/TemplateNavigationRuntime";
import { AqiqahLittleBloomNavigationAdapter } from "../navigation-adapter";
import {
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  Calendar,
  Clock,
  MapPin,
  Gift,
  MessageSquare,
  Copy,
  Check,
  ChevronDown,
  Baby,
  Moon,
  Star,
  ExternalLink,
  Scale,
  Ruler,
  CalendarPlus,
  Send,
  BookOpen,
  MailOpen,
} from "lucide-react";

type WishItem = {
  id: string;
  name: string;
  message: string;
  attendance: "hadir" | "tidak_hadir" | "ragu";
  createdAt: string;
};

const initialWishes: WishItem[] = [
  {
    id: "1",
    name: "Ustadz H. Ahmad Dahlan",
    message:
      "Barakallahu laka fil mawhubi laka wa syakarta al-wahib. Semoga Rayyan menjadi generasi Qur'ani yang berakhlak mulia dan membanggakan orang tua.",
    attendance: "hadir",
    createdAt: "10 menit yang lalu",
  },
  {
    id: "2",
    name: "Tante Sarah & Om Dimas",
    message:
      "Selamat atas tasyakuran aqiqah Baby Rayyan! Sehat selalu ya sayang, tumbuh jadi anak pinter, sholeh, dan banyak rezeki.",
    attendance: "hadir",
    createdAt: "35 menit yang lalu",
  },
  {
    id: "3",
    name: "Keluarga Besar Bpk. Hendra",
    message:
      "Alhamdulillah, selamat Mas Irfan & Mbak Annisa. Insya Allah kami sekeluarga hadir mendoakan ananda tercinta.",
    attendance: "hadir",
    createdAt: "1 jam yang lalu",
  },
];

const defaultGalleryImages = [
  "/assets/aqiqah/baby-portrait.png",
  "/assets/aqiqah/baby-landscape.png",
  "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544126592-807ade215a0b?w=800&auto=format&fit=crop&q=80",
];

function createAqiqahNavigationAdapter() {
  return new AqiqahLittleBloomNavigationAdapter();
}

export function AqiqahLittleBloomSource() {
  const [opened, setOpened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [guestName, setGuestName] = useState("Tamu Undangan");
  const [activeNav, setActiveNav] = useState("hero");
  const [galleryImages, setGalleryImages] = useState<string[]>(defaultGalleryImages);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Wishes state
  const [wishes, setWishes] = useState<WishItem[]>(initialWishes);
  const [wishName, setWishName] = useState("");
  const [wishMessage, setWishMessage] = useState("");
  const [attendance, setAttendance] = useState<"hadir" | "tidak_hadir" | "ragu">("hadir");
  const [, startTransition] = useTransition();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRootRef = useRef<HTMLElement | null>(null);
  const confettiRef = useRef<ConfettiHandle | null>(null);

  // Extract `?for=...` parameter from URL for guest name
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const forParam = urlParams.get("for");
      if (forParam) {
        setGuestName(decodeURIComponent(forParam.replace(/\+/g, " ")));
      }
    }
  }, []);

  // Sync navigation events with Visual Editor
  useEffect(() => {
    const handlePreviewNavigate = (event: Event) => {
      const customEvent = event as CustomEvent<{ sectionType: string }>;
      const targetType = customEvent.detail?.sectionType;
      if (targetType === "opening-envelope") {
        setOpened(false);
        return;
      }
      setOpened(true);
    };

    const handleGalleryUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ urls: string[] }>;
      if (customEvent.detail?.urls && Array.isArray(customEvent.detail.urls)) {
        setGalleryImages(customEvent.detail.urls);
      }
    };

    window.addEventListener("aqiqah-preview-navigate", handlePreviewNavigate);
    window.addEventListener("aqiqah-gallery-update", handleGalleryUpdate);
    return () => {
      window.removeEventListener("aqiqah-preview-navigate", handlePreviewNavigate);
      window.removeEventListener("aqiqah-gallery-update", handleGalleryUpdate);
    };
  }, []);

  // Listen to active section change from navigation runtime
  useEffect(() => {
    const handleActiveSection = (event: Event) => {
      const sectionType = (event as CustomEvent<{ sectionType?: string }>).detail?.sectionType;
      if (!sectionType || sectionType === "opening-envelope") return;
      if (sectionType === "hero" || sectionType === "prayer" || sectionType === "profile") {
        setActiveNav("hero");
      } else if (sectionType === "event") {
        setActiveNav("event");
      } else if (sectionType === "gallery") {
        setActiveNav("gallery");
      } else if (sectionType === "gift") {
        setActiveNav("gift");
      } else if (sectionType === "wishes" || sectionType === "closing") {
        setActiveNav("wishes");
      }
    };
    window.addEventListener(TEMPLATE_ACTIVE_EVENT, handleActiveSection);
    return () => window.removeEventListener(TEMPLATE_ACTIVE_EVENT, handleActiveSection);
  }, []);

  // SCROLL SPY: High-precision scroll listener for auto-switching navbar active item smoothly
  useEffect(() => {
    if (!opened) return;
    const root = scrollRootRef.current;
    if (!root) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const sections = Array.from(
          root.querySelectorAll<HTMLElement>("[data-template-section]")
        ).filter(
          (s) =>
            s.dataset.templateSection !== "opening-envelope" &&
            !s.hidden &&
            s.style.display !== "none"
        );
        if (sections.length === 0) return;

        // If user scrolled near the top, hero is active
        if (root.scrollTop < 80) {
          setActiveNav("hero");
          return;
        }

        // If user reached near bottom, wishes is active
        const distanceToBottom = root.scrollHeight - root.scrollTop - root.clientHeight;
        if (distanceToBottom < 80) {
          setActiveNav("wishes");
          return;
        }

        const rootRect = root.getBoundingClientRect();
        const markerY = rootRect.top + rootRect.height * 0.38;

        for (const section of sections) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= markerY && rect.bottom > markerY) {
            const secType = section.dataset.templateSection;
            if (!secType || secType === "opening-envelope") return;
            if (secType === "hero" || secType === "prayer" || secType === "profile") {
              setActiveNav("hero");
            } else if (secType === "event") {
              setActiveNav("event");
            } else if (secType === "gallery") {
              setActiveNav("gallery");
            } else if (secType === "gift") {
              setActiveNav("gift");
            } else if (secType === "wishes" || secType === "closing") {
              setActiveNav("wishes");
            }
            return;
          }
        }
      });
    };

    root.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => root.removeEventListener("scroll", handleScroll);
  }, [opened]);

  // Countdown logic
  const [countdown, setCountdown] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });

  useEffect(() => {
    const targetDate = new Date("2026-12-20T09:00:00+07:00").getTime();
    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) {
        setCountdown({ days: "00", hours: "00", minutes: "00", seconds: "00" });
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setCountdown({
          days: String(days).padStart(2, "0"),
          hours: String(hours).padStart(2, "0"),
          minutes: String(minutes).padStart(2, "0"),
          seconds: String(seconds).padStart(2, "0"),
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenInvitation = () => {
    setOpened(true);
    confettiRef.current?.triggerBurst(80);
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleNavClick = (sectionType: string) => {
    setActiveNav(sectionType);
    window.dispatchEvent(
      new CustomEvent(TEMPLATE_NAVIGATE_EVENT, {
        detail: {
          sectionId: sectionType,
          requestId: crypto.randomUUID(),
          source: "preview-navbar",
        },
      })
    );
  };

  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishName.trim() || !wishMessage.trim()) return;
    startTransition(() => {
      const newWish: WishItem = {
        id: Date.now().toString(),
        name: wishName,
        message: wishMessage,
        attendance,
        createdAt: "Baru saja",
      };
      setWishes([newWish, ...wishes]);
      setWishName("");
      setWishMessage("");
    });
  };

  const googleCalUrl =
    "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Tasyakuran+Walimatul+Aqiqah+Muhammad+Rayyan+Al-Fatih&dates=20261220T020000Z/20261220T050000Z&details=Walimatul+Aqiqah+dan+Doa+Bersama+Keluarga+Bpk.+Irfan+Maulana&location=Kemang,+Jakarta+Selatan";

  return (
    <main
      ref={scrollRootRef}
      className="aqiqah-shell"
      data-template-scroll-root="true"
      data-template-hydrated="true"
      data-opened={opened ? "true" : "false"}
    >
      {/* Navigation Manager Runtime */}
      <TemplateNavigationRuntime createAdapter={createAqiqahNavigationAdapter} />

      {/* Falling watercolor floral petals continuously */}
      <AqiqahFloralPetals maxPetals={20} />

      {/* Falling star & moon sparkles confetti on envelope open */}
      <AqiqahConfetti ref={confettiRef} />

      {/* Background audio */}
      <audio ref={audioRef} loop preload="metadata">
        <source src="/assets/audio/Playful-Sunshine.mp3" type="audio/mpeg" />
      </audio>

      {/* Stationary audio button */}
      {opened && (
        <button
          type="button"
          className={`aqiqah-audio-btn ${isPlaying ? "playing" : ""}`}
          onClick={toggleAudio}
          aria-label="Toggle Musik"
        >
          {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      )}

      {/* ════════════════════════════════════════════════════════════════
          1. OPENING ENVELOPE SCREEN (LUXURY 3D LETTER & ENVELOPE)
          ════════════════════════════════════════════════════════════════ */}
      <section
        data-template-section="opening-envelope"
        className={`aqiqah-envelope-screen ${opened ? "opened" : ""}`}
        aria-hidden={opened}
      >
        <div className="aqiqah-watercolor-bg" />
        <AqiqahCornerFloral position="top-left" />
        <AqiqahCornerFloral position="bottom-right" />
        <AqiqahBabyBlocks position="top-right" />
        <AqiqahBabyBlocks position="bottom-left" />

        {/* Envelope Header */}
        <div className="aqiqah-env-header">
          <p className="text-xs font-serif text-slate-500 pt-1" data-field="bismillah">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <div className="aqiqah-star-badge">
            <Sparkles size={11} className="text-amber-500" />
            <span data-field="kicker">✦ WALIMATUL AQIQAH ✦</span>
            <Sparkles size={11} className="text-amber-500" />
          </div>
          <h1 className="aqiqah-env-title" data-field="title">
            Tasyakuran Aqiqah
          </h1>
          <h2 className="aqiqah-env-subtitle" data-field="subtitle">
            Muhammad Rayyan Al-Fatih
          </h2>
          <span className="aqiqah-env-date" data-field="date">
            Ahad, 20 Desember 2026
          </span>
        </div>

        {/* Realistic 3D Envelope & Peeking Letter */}
        <div className="aqiqah-env-box">
          <div className="aqiqah-envelope-outer">
            {/* SVG Flap with gold trim */}
            <div className="aqiqah-envelope-flap-wrap">
              <AqiqahEnvelopeFlap />
              {/* 3D Wax Seal right over flap tip */}
              <div className="aqiqah-wax-seal-anchor">
                <AqiqahWaxSeal onClick={handleOpenInvitation} />
              </div>
            </div>

            {/* Envelope pocket body */}
            <div className="aqiqah-envelope-pocket">
              {/* Guest Invitation Letter Card peeking inside */}
              <div className="aqiqah-guest-letter">
                <div className="aqiqah-guest-corner-deco" />
                <div className="aqiqah-guest-lbl">Kepada Yth. Bapak/Ibu/Saudara/i:</div>
                <h3 className="aqiqah-guest-name">{guestName}</h3>
                <span className="aqiqah-guest-sub">Di Tempat</span>
              </div>
            </div>
          </div>

          {/* Shimmering CTA Button */}
          <button
            type="button"
            className="aqiqah-btn-open"
            onClick={handleOpenInvitation}
          >
            <MailOpen size={16} />
            <span>Buka Undangan</span>
            <Sparkles size={14} />
          </button>

          <p className="aqiqah-env-note">
            Sentuh segel atau tombol untuk membuka undangan & memutar musik
          </p>
        </div>

        <p className="text-[10.5px] text-slate-400 font-medium relative z-10">
          Mohon maaf apabila ada kesalahan penulisan nama atau gelar
        </p>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          2. HERO SECTION (Mobile-First 1 Viewport)
          ════════════════════════════════════════════════════════════════ */}
      <section data-template-section="hero" className="aqiqah-hero">
        <div className="aqiqah-watercolor-bg" />
        <AqiqahCornerFloral position="top-left" />
        <AqiqahCornerFloral position="bottom-right" />
        <AqiqahBabyBlocks position="top-right" />
        <AqiqahBabyBlocks position="bottom-left" />

        <p className="text-sm font-serif text-slate-500 pt-2 relative z-10" data-field="bismillah">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>

        <div className="aqiqah-star-badge relative z-10">
          <span data-field="kicker">✦ TASYAKURAN WALIMATUL AQIQAH ✦</span>
        </div>

        {/* Baby Frame with Floral Wreath */}
        <div className="aqiqah-frame-container relative z-10">
          <AqiqahFrameWreath />
          <div className="aqiqah-baby-frame">
            <div
              data-avatar-box
              className="w-full h-full flex flex-col items-center justify-center bg-amber-50 text-amber-600"
              style={{ display: "none" }}
            >
              <Baby size={52} />
            </div>
            <img
              data-field-image
              src="/assets/aqiqah/baby-landscape.png"
              alt="Foto Buah Hati"
              style={{ display: "block" }}
              className="aqiqah-hero-circle-img"
            />
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-2xl font-black text-slate-800 font-serif" data-field="title">
            Muhammad Rayyan Al-Fatih
          </h2>
          <p className="text-sm font-bold text-amber-700 mt-0.5" data-field="nickname">
            (Baby Rayyan)
          </p>
        </div>

        <p className="text-xs text-slate-600 max-w-xs leading-relaxed relative z-10" data-field="copy">
          Puji dan syukur kami panjatkan ke hadirat Allah SWT atas karunia dan amanah kelahiran putra kami tercinta.
        </p>

        <div className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5 relative z-10">
          <Calendar size={13} className="text-amber-600" />
          <span data-field="date">Ahad, 20 Desember 2026</span>
        </div>

        {/* Countdown timer */}
        <div className="aqiqah-countdown-grid relative z-10">
          <div className="aqiqah-countdown-box">
            <div className="aqiqah-countdown-val">{countdown.days}</div>
            <div className="aqiqah-countdown-lbl">Hari</div>
          </div>
          <div className="aqiqah-countdown-box">
            <div className="aqiqah-countdown-val">{countdown.hours}</div>
            <div className="aqiqah-countdown-lbl">Jam</div>
          </div>
          <div className="aqiqah-countdown-box">
            <div className="aqiqah-countdown-val">{countdown.minutes}</div>
            <div className="aqiqah-countdown-lbl">Menit</div>
          </div>
          <div className="aqiqah-countdown-box">
            <div className="aqiqah-countdown-val">{countdown.seconds}</div>
            <div className="aqiqah-countdown-lbl">Detik</div>
          </div>
        </div>

        <button
          type="button"
          className="text-slate-400 pb-1 animate-bounce p-2 relative z-10"
          onClick={() => handleNavClick("prayer")}
          aria-label="Scroll Down"
        >
          <ChevronDown size={22} />
        </button>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          3. PRAYER SECTION (Ayat & Hadits Tasyakuran)
          ════════════════════════════════════════════════════════════════ */}
      <section data-template-section="prayer" className="aqiqah-section">
        <div className="aqiqah-prayer-card">
          <div className="aqiqah-prayer-icon-badge">
            <Sparkles size={18} />
          </div>
          <div className="aqiqah-prayer-header">
            <span className="aqiqah-eyebrow">DOA &amp; HADITS AQIQAH</span>
          </div>
          <p className="aqiqah-arabic" data-field="arabic">
            كُلُّ غُلاَمٍ رَهِينَةٌ بِعَقِيقَتِهِ تُذْبَحُ عَنْهُ يَوْمَ سَابِعِهِ وَيُحْلَقُ وَيُسَمَّى
          </p>
          <div className="aqiqah-prayer-divider">
            <span />
            <Sparkles size={12} className="text-amber-500" />
            <span />
          </div>
          <p className="aqiqah-translation" data-field="translation">
            &ldquo;Setiap anak tergadaikan dengan aqiqahnya, disembelihkan untuknya pada hari ketujuh, dicukur rambutnya, dan diberi nama.&rdquo;
          </p>
          <div className="text-center mt-3">
            <span className="aqiqah-source-badge" data-field="source">
              — HR. Abu Dawud, At-Tirmidzi, &amp; An-Nasa&apos;i
            </span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          4. PROFILE & BIODATA SECTION
          ════════════════════════════════════════════════════════════════ */}
      <section data-template-section="profile" className="aqiqah-section">
        <div className="aqiqah-section-header">
          <span className="aqiqah-eyebrow" data-field="eyebrow">
            PUTRA TERCINTA KAMI
          </span>
          <h3 className="aqiqah-title" data-field="childName">
            Muhammad Rayyan Al-Fatih
          </h3>
          <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 mt-1.5" data-field="gender">
            ✦ Putra Pertama ✦
          </div>
        </div>

        <div className="aqiqah-card">
          <div className="aqiqah-profile-photo-wrap">
            <img
              data-field-image
              src="/assets/aqiqah/baby-landscape.png"
              alt="Foto Buah Hati"
              className="aqiqah-profile-photo"
            />
            <div className="aqiqah-profile-photo-caption">
              ✦ Tasyakuran Walimatul &lsquo;Aqiqah ✦
            </div>
          </div>

          <div className="aqiqah-bio-grid">
            <div className="aqiqah-bio-card bio-date">
              <div className="aqiqah-bio-icon">
                <Calendar size={18} />
              </div>
              <div className="aqiqah-bio-lbl">Hari &amp; Tanggal Lahir</div>
              <div className="aqiqah-bio-val" data-field="birthDate">
                Senin, 07 Des 2026
              </div>
            </div>
            <div className="aqiqah-bio-card bio-time">
              <div className="aqiqah-bio-icon">
                <Clock size={18} />
              </div>
              <div className="aqiqah-bio-lbl">Jam Kelahiran</div>
              <div className="aqiqah-bio-val" data-field="birthTime">
                06.45 WIB
              </div>
            </div>
            <div className="aqiqah-bio-card bio-weight">
              <div className="aqiqah-bio-icon">
                <Scale size={18} />
              </div>
              <div className="aqiqah-bio-lbl">Berat Lahir</div>
              <div className="aqiqah-bio-val" data-field="birthWeight">
                3.35 kg
              </div>
            </div>
            <div className="aqiqah-bio-card bio-height">
              <div className="aqiqah-bio-icon">
                <Ruler size={18} />
              </div>
              <div className="aqiqah-bio-lbl">Panjang Lahir</div>
              <div className="aqiqah-bio-val" data-field="birthHeight">
                50 cm
              </div>
            </div>
          </div>

          <div className="aqiqah-parents-card mt-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold mb-2 border border-rose-100">
              <Heart size={12} className="text-rose-500 fill-rose-500" />
              <span>Orang Tua Terkasih</span>
            </div>
            <p className="text-xs font-bold text-slate-800" data-field="parents">
              Putra dari Bpk. Irfan Maulana &amp; Ibu Annisa Wardani
            </p>
            <div className="aqiqah-parents-quote mt-2">
              <p className="text-xs text-slate-600 italic leading-relaxed" data-field="doa">
                &ldquo;Semoga Allah SWT menjadikan ananda anak yang sholeh, cerdas, berakhlak mulia, berbakti kepada kedua orang tua, serta menjadi penyejuk hati bagi keluarga dan umat.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          5. EVENT SECTION (WAKTU & TEMPAT)
          ════════════════════════════════════════════════════════════════ */}
      <section data-template-section="event" className="aqiqah-section">
        <div className="aqiqah-section-header">
          <span className="aqiqah-eyebrow" data-field="eyebrow">
            WAKTU &amp; LOKASI
          </span>
          <h3 className="aqiqah-title" data-field="title">
            Rangkaian Acara Tasyakuran
          </h3>
        </div>

        <div className="aqiqah-card text-center">
          <div className="aqiqah-star-badge mx-auto mb-3">
            <span data-field="eventBadge">Tasyakuran &amp; Doa Bersama</span>
          </div>

          <h4 className="text-base font-bold text-slate-800 font-serif" data-field="eventTitle">
            Walimatul Aqiqah &amp; Potong Rambut
          </h4>

          <div className="flex flex-col gap-2.5 text-xs text-slate-600 my-4">
            <div className="flex items-center justify-center gap-1.5">
              <Calendar size={14} className="text-amber-600" />
              <span data-field="eventDate">Ahad, 20 Desember 2026</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Clock size={14} className="text-amber-600" />
              <span data-field="eventTime">Pukul 09.00 – 12.00 WIB</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <MapPin size={14} className="text-amber-600 flex-shrink-0" />
              <span className="font-bold text-slate-700" data-field="venueName">
                Kediaman Keluarga Bpk. Irfan &amp; Ibu Annisa
              </span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-normal" data-field="venueAddress">
              Jl. Dahlia Indah No. 18, Kemang, Jakarta Selatan
            </p>
          </div>

          <div className="aqiqah-event-actions">
            <a
              data-map-link
              href="https://maps.google.com"
              target="_blank"
              rel="noreferrer"
              className="aqiqah-btn-map"
            >
              <MapPin size={14} />
              <span data-field="mapLabel">Buka Google Maps</span>
              <ExternalLink size={12} />
            </a>
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noreferrer"
              className="aqiqah-btn-cal"
            >
              <CalendarPlus size={14} />
              <span>Simpan ke Kalender</span>
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          6. GALLERY SECTION (3D COVERFLOW & LIGHTBOX)
          ════════════════════════════════════════════════════════════════ */}
      <section data-template-section="gallery" className="aqiqah-section">
        <div className="aqiqah-section-header">
          <span className="aqiqah-eyebrow" data-field="eyebrow">
            SWEET MOMENTS
          </span>
          <h3 className="aqiqah-title" data-field="title">
            Galeri Buah Hati
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto" data-field="description">
            Potret kebahagiaan dan kehangatan menyambut kehadiran malaikat kecil kami.
          </p>
        </div>

        <AqiqahGallery images={galleryImages} />
      </section>

      {/* ════════════════════════════════════════════════════════════════
          7. GIFT & DIGITAL ENVELOPE (ATM CARD DESIGN)
          ════════════════════════════════════════════════════════════════ */}
      <section data-template-section="gift" className="aqiqah-section aqiqah-section--gift">
        <div className="aqiqah-section-header">
          <span className="aqiqah-eyebrow" data-field="eyebrow">HADIAH DIGITAL</span>
          <h3 className="aqiqah-title" data-field="title">Tanda Kasih &amp; Hadiah</h3>
          <p className="aqiqah-gift-desc" data-field="description">
            Doa restu Anda merupakan karunia terindah. Bagi yang ingin memberikan tanda kasih, dapat melalui:
          </p>
        </div>

        <div className="aqiqah-bank-cards">
          {/* BCA Card */}
          <div className="aqiqah-bank-card aqiqah-bank-card--bca">
            <div className="aqiqah-bank-card__shine" />
            <div className="aqiqah-bank-card__top">
              <div className="aqiqah-chip" />
              <span className="aqiqah-bank-card__name" data-field="bank1Name">BCA</span>
            </div>
            <div className="aqiqah-bank-card__mid">
              <p className="aqiqah-bank-card__label">Nomor Rekening</p>
              <p className="aqiqah-bank-card__number" data-field="bank1Account">8830 1928 47</p>
            </div>
            <div className="aqiqah-bank-card__bot">
              <div>
                <p className="aqiqah-bank-card__label">Atas Nama</p>
                <p className="aqiqah-bank-card__holder" data-field="bank1Holder">Irfan Maulana</p>
              </div>
              <button
                type="button"
                className="aqiqah-btn-copy-card"
                onClick={() => copyToClipboard("8830192847", "bank1")}
              >
                {copiedKey === "bank1" ? (
                  <><Check size={12} /><span>Tersalin!</span></>
                ) : (
                  <><Copy size={12} /><span>Salin</span></>
                )}
              </button>
            </div>
          </div>

          {/* BSI Card */}
          <div className="aqiqah-bank-card aqiqah-bank-card--bsi">
            <div className="aqiqah-bank-card__shine" />
            <div className="aqiqah-bank-card__top">
              <div className="aqiqah-chip" />
              <span className="aqiqah-bank-card__name" data-field="bank2Name">BSI</span>
            </div>
            <div className="aqiqah-bank-card__mid">
              <p className="aqiqah-bank-card__label">Nomor Rekening</p>
              <p className="aqiqah-bank-card__number" data-field="bank2Account">7128 3940 12</p>
            </div>
            <div className="aqiqah-bank-card__bot">
              <div>
                <p className="aqiqah-bank-card__label">Atas Nama</p>
                <p className="aqiqah-bank-card__holder" data-field="bank2Holder">Annisa Wardani</p>
              </div>
              <button
                type="button"
                className="aqiqah-btn-copy-card"
                onClick={() => copyToClipboard("7128394012", "bank2")}
              >
                {copiedKey === "bank2" ? (
                  <><Check size={12} /><span>Tersalin!</span></>
                ) : (
                  <><Copy size={12} /><span>Salin</span></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Physical Gift */}
        <div className="aqiqah-gift-physical">
          <div className="aqiqah-gift-physical__icon">
            <Gift size={20} />
          </div>
          <div className="aqiqah-gift-physical__body">
            <p className="aqiqah-gift-physical__title">Kirim Kado Fisik</p>
            <p className="aqiqah-gift-physical__address" data-field="giftAddress">
              Jl. Dahlia Indah No. 18, Kemang, Jakarta Selatan (12730)
            </p>
            <p className="aqiqah-gift-physical__recipient" data-field="giftRecipient">
              Penerima: Keluarga Rayyan · 0812-3456-7890
            </p>
          </div>
          <button
            type="button"
            className="aqiqah-gift-physical__copy"
            onClick={() => copyToClipboard("Jl. Dahlia Indah No. 18, Kemang, Jakarta Selatan (12730)", "address")}
            aria-label="Salin alamat"
          >
            {copiedKey === "address" ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          8. WISHES / GUESTBOOK & RSVP
          ════════════════════════════════════════════════════════════════ */}
      <section data-template-section="wishes" className="aqiqah-section">
        <div className="aqiqah-section-header">
          <span className="aqiqah-eyebrow" data-field="eyebrow">
            GUESTBOOK &amp; RSVP
          </span>
          <h3 className="aqiqah-title" data-field="title">
            Untaian Doa &amp; Ucapan
          </h3>
          <p className="text-xs text-slate-500 mt-1" data-field="description">
            Tinggalkan doa dan pesan hangat untuk ananda Muhammad Rayyan Al-Fatih.
          </p>
        </div>

        <div className="aqiqah-card aqiqah-wishes-card">
          {/* Form */}
          <form onSubmit={handleAddWish} className="aqiqah-wishes-form">
            <div className="aqiqah-wishes-form__row">
              <input
                type="text"
                placeholder="Nama Anda"
                value={wishName}
                onChange={(e) => setWishName(e.target.value)}
                className="aqiqah-input"
                required
              />
            </div>
            <textarea
              placeholder="Tuliskan doa & ucapan selamat..."
              value={wishMessage}
              onChange={(e) => setWishMessage(e.target.value)}
              className="aqiqah-input"
              rows={3}
              required
            />
            <div className="aqiqah-attendance-pills">
              {([
                { value: "hadir", label: "✓ Hadir", mod: "--hadir" },
                { value: "tidak_hadir", label: "✗ Berhalangan", mod: "--tidak" },
                { value: "ragu", label: "? Masih Ragu", mod: "--ragu" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`aqiqah-pill-opt aqiqah-pill-opt${opt.mod} ${attendance === opt.value ? "active" : ""}`}
                  onClick={() => setAttendance(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="aqiqah-btn-submit-wish"
            >
              <Send size={13} />
              <span>Kirim Doa Restu</span>
            </button>
          </form>

          {/* Divider */}
          <div className="aqiqah-wishes-divider">
            <span />
            <span className="aqiqah-wishes-divider__label">Doa &amp; Ucapan</span>
            <span />
          </div>

          {/* List */}
          <div className="aqiqah-wishes-list">
            {wishes.map((w) => (
              <div key={w.id} className="aqiqah-wish-bubble">
                <div className="flex items-start gap-2.5">
                  <div className="aqiqah-wish-avatar">
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 truncate">{w.name}</span>
                      <span className={`aqiqah-wish-badge ${
                        w.attendance === "hadir"
                          ? "aqiqah-wish-badge--hadir"
                          : w.attendance === "tidak_hadir"
                          ? "aqiqah-wish-badge--tidak"
                          : "aqiqah-wish-badge--ragu"
                      }`}>
                        {w.attendance === "hadir" ? "✓ Hadir" : w.attendance === "tidak_hadir" ? "✗ Berhalangan" : "? Ragu"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">{w.message}</p>
                    <span className="text-[9px] text-slate-400 block mt-1">{w.createdAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          9. CLOSING SECTION
          ════════════════════════════════════════════════════════════════ */}
      <section data-template-section="closing" className="aqiqah-hero" style={{ minHeight: "65vh", paddingBottom: "110px" }}>
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-md">
          <Heart size={26} />
        </div>

        <div className="aqiqah-star-badge">
          <span data-field="eyebrow">JAZAKUMULLAH KHAIRAN</span>
        </div>

        <h3 className="text-2xl font-black text-slate-800 font-serif" data-field="title">
          Terima Kasih
        </h3>

        <p className="text-xs text-slate-600 max-w-xs leading-relaxed" data-field="message">
          Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu bagi putra kami tercinta.
        </p>

        <div className="border-t border-slate-200 pt-3 mt-2">
          <p className="text-xs font-semibold text-slate-500">Keluarga Besar:</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5" data-field="family">
            Keluarga Besar Irfan Maulana &amp; Annisa Wardani
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          10. BOTTOM FLOATING NAVIGATION BAR (iOS Frosted Glass)
          ════════════════════════════════════════════════════════════════ */}
      {opened && (
        <nav className="aqiqah-bottom-nav">
          <button
            type="button"
            className={`aqiqah-nav-item ${activeNav === "hero" ? "active" : ""}`}
            onClick={() => handleNavClick("hero")}
          >
            <Baby size={16} />
            <span>Utama</span>
          </button>
          <button
            type="button"
            className={`aqiqah-nav-item ${activeNav === "event" ? "active" : ""}`}
            onClick={() => handleNavClick("event")}
          >
            <Calendar size={16} />
            <span>Acara</span>
          </button>
          <button
            type="button"
            className={`aqiqah-nav-item ${activeNav === "gallery" ? "active" : ""}`}
            onClick={() => handleNavClick("gallery")}
          >
            <Star size={16} />
            <span>Galeri</span>
          </button>
          <button
            type="button"
            className={`aqiqah-nav-item ${activeNav === "gift" ? "active" : ""}`}
            onClick={() => handleNavClick("gift")}
          >
            <Gift size={16} />
            <span>Hadiah</span>
          </button>
          <button
            type="button"
            className={`aqiqah-nav-item ${activeNav === "wishes" ? "active" : ""}`}
            onClick={() => handleNavClick("wishes")}
          >
            <MessageSquare size={16} />
            <span>Ucapan</span>
          </button>
        </nav>
      )}
    </main>
  );
}
