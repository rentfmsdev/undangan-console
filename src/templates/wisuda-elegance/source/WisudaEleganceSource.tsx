"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  GraduationCap,
  Calendar,
  CalendarPlus,
  Clock,
  MapPin,
  ExternalLink,
  VolumeX,
  Volume2,
  ChevronDown,
  Award,
  BookOpen,
  Image as ImageIcon,
  Camera,
  MessageSquare,
  Sparkles,
  User,
  X,
  Building,
  School,
} from "lucide-react";
import { TemplateNavigationRuntime } from "@/templates/navigation/TemplateNavigationRuntime";
import { WisudaNavigationAdapter } from "../navigation-adapter";
import confetti from "canvas-confetti";
import "./wisuda.css";

type Props = {
  invitationId?: string;
  verifiedGuestName?: string;
};

type Wish = {
  id: string;
  name: string;
  attendance?: string;
  message: string;
  createdAt: string;
};

const initialGalleryPhotos: string[] = [];

const initialWishes: Wish[] = [
  {
    id: "w1",
    name: "Dr. Ir. Hendra Gunawan, M.T.",
    message: "Selamat atas kelulusan dan gelar Sarjananya Anindya! Dedikasi dan integritas yang luar biasa selama di almamater. Sukses terus melangkah ke jenjang karir berikutnya!",
    createdAt: "Baru saja",
  },
  {
    id: "w2",
    name: "Rizky & Rekan Mahasiswa",
    message: "Happy graduation Anin! Selamat berproses ke dunia nyata, semoga ilmu yang didapat berkah dan membanggakan almamater tercinta!",
    createdAt: "2 jam lalu",
  },
  {
    id: "w3",
    name: "Keluarga Besar Bpk. Raharjo",
    message: "Alhamdulillah, selamat ananda Anindya atas gelar Sarjana Komputernya. Semoga ilmunya berkah dan senantiasa membanggakan orang tua.",
    createdAt: "5 jam lalu",
  },
];

export default function WisudaEleganceSource({ invitationId, verifiedGuestName }: Props) {
  const [opened, setOpened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNav, setActiveNav] = useState("hero");
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(initialGalleryPhotos);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Countdown timer state
  const [countdown, setCountdown] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });

  // Wishes state
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);
  const [wishName, setWishName] = useState("");
  const [wishMessage, setWishMessage] = useState("");
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const popperBtnRef = useRef<HTMLButtonElement | null>(null);
  const [popperActive, setPopperActive] = useState(false);

  // Confetti blaster from trumpet toward photo
  const handleFireConfetti = () => {
    setPopperActive(true);
    setTimeout(() => setPopperActive(false), 450);

    const rect = popperBtnRef.current?.getBoundingClientRect();
    const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.82;
    const y = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.72;

    try {
      confetti({
        particleCount: 75,
        angle: 135,
        spread: 65,
        origin: { x, y },
        startVelocity: 50,
        colors: ["#f43f5e", "#f59e0b", "#06b6d4", "#8b5cf6", "#10b981", "#ec4899", "#6366f1"],
        ticks: 240,
        gravity: 0.85,
        scalar: 1.15,
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 80,
          origin: { x, y },
          startVelocity: 38,
          colors: ["#fbbf24", "#38bdf8", "#f43f5e", "#a855f7", "#34d399"],
          ticks: 190,
        });
      }, 130);
    } catch (err) {
      console.error("Confetti blast error:", err);
    }
  };

  // Create Navigation Adapter
  const createNavigationAdapter = useCallback(() => new WisudaNavigationAdapter(), []);

  // Countdown effect
  useEffect(() => {
    const targetDate = new Date("2026-10-17T08:00:00").getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen to navigation events, gallery updates, and sync active section on scroll
  useEffect(() => {
    const sections = [
      { id: "hero", navId: "hero" },
      { id: "quote", navId: "hero" },
      { id: "profile", navId: "profile" },
      { id: "event", navId: "event" },
      { id: "gallery", navId: "gallery" },
      { id: "wishes", navId: "wishes" },
      { id: "closing", navId: "wishes" },
    ];

    const handleActiveSection = (e: Event) => {
      const detail = (e as CustomEvent<{ sectionType: string }>).detail;
      if (detail?.sectionType) {
        const found = sections.find((s) => s.id === detail.sectionType);
        if (found) setActiveNav(found.navId);
      }
    };

    const handleGalleryUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ urls: string[] }>).detail;
      if (detail && Array.isArray(detail.urls)) {
        setGalleryPhotos(detail.urls);
      }
    };

    const handleNavigate = (e: Event) => {
      const detail = (e as CustomEvent<{ sectionType?: string }>).detail;
      if (detail?.sectionType === "opening-envelope") {
        setOpened(false);
      } else if (detail?.sectionType) {
        setOpened(true);
      }
    };

    const handleScrollSync = () => {
      const targetLine = window.innerHeight * 0.35;
      let currentNav = "hero";

      for (const sec of sections) {
        const el = document.querySelector<HTMLElement>(`[data-template-section="${sec.id}"]`);
        if (el && el.offsetParent !== null) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= targetLine) {
            currentNav = sec.navId;
          }
        }
      }

      setActiveNav(currentNav);
    };

    const scrollRoot = document.querySelector<HTMLElement>("[data-template-scroll-root]");
    scrollRoot?.addEventListener("scroll", handleScrollSync, { passive: true });
    window.addEventListener("scroll", handleScrollSync, { passive: true });

    window.addEventListener("template:active-section", handleActiveSection);
    window.addEventListener("wisuda-active-section", handleActiveSection);
    window.addEventListener("wisuda-gallery-update", handleGalleryUpdate);
    window.addEventListener("wisuda-preview-navigate", handleNavigate);

    return () => {
      scrollRoot?.removeEventListener("scroll", handleScrollSync);
      window.removeEventListener("scroll", handleScrollSync);
      window.removeEventListener("template:active-section", handleActiveSection);
      window.removeEventListener("wisuda-active-section", handleActiveSection);
      window.removeEventListener("wisuda-gallery-update", handleGalleryUpdate);
      window.removeEventListener("wisuda-preview-navigate", handleNavigate);
    };
  }, []);

  // Fetch real wishes if invitationId provided
  useEffect(() => {
    if (!invitationId) return;
    fetch(`/api/wishes?invitationId=${encodeURIComponent(invitationId)}`)
      .then((res) => (res.ok ? res.json() : { wishes: [] }))
      .then((data) => {
        if (Array.isArray(data.wishes) && data.wishes.length > 0) {
          setWishes(data.wishes);
        }
      })
      .catch(() => {});
  }, [invitationId]);

  // Handle Envelope Open
  const handleOpenInvitation = () => {
    setOpened(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
    window.dispatchEvent(
      new CustomEvent("template:navigate", {
        detail: { sectionId: "hero", requestId: crypto.randomUUID(), source: "opening-envelope" },
      })
    );
  };

  // Toggle Audio
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Navigate to section via bottom nav
  const navigateTo = (sectionId: string) => {
    window.dispatchEvent(
      new CustomEvent("template:navigate", {
        detail: { sectionId, requestId: crypto.randomUUID(), source: "preview-navbar" },
      })
    );
  };

  // Submit wish
  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishName.trim() || !wishMessage.trim()) return;

    setIsSubmittingWish(true);
    const newWish: Wish = {
      id: crypto.randomUUID(),
      name: wishName.trim(),
      message: wishMessage.trim(),
      createdAt: "Baru saja",
    };

    if (invitationId) {
      try {
        await fetch("/api/wishes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invitationId,
            name: newWish.name,
            message: newWish.message,
            attendance: "Hadir",
          }),
        });
      } catch {}
    }

    setWishes((prev) => [newWish, ...prev]);
    setWishName("");
    setWishMessage("");
    setIsSubmittingWish(false);
  };

  const guestDisplayName = verifiedGuestName || "Bapak/Ibu/Saudara/i";

  return (
    <main
      data-template-scroll-root
      data-template-hydrated="true"
      data-opened={opened ? "true" : "false"}
      className="wisuda-shell"
      data-use-container="true"
    >
      <TemplateNavigationRuntime createAdapter={createNavigationAdapter} />

      {/* Background Audio */}
      <audio ref={audioRef} loop preload="metadata">
        <source src="/assets/audio/Playful-Sunshine.mp3" type="audio/mpeg" />
      </audio>

      {/* Stationary Audio Control Button */}
      {opened && (
        <button
          type="button"
          onClick={toggleAudio}
          className={`wisuda-audio-btn ${isPlaying ? "wisuda-spin" : ""}`}
          title={isPlaying ? "Jeda Musik" : "Putar Musik"}
          aria-label={isPlaying ? "Jeda Musik" : "Putar Musik"}
        >
          {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      )}

      {/* -------------------------------------------------------------
          1. OPENING ENVELOPE (Simple, Clean & Direct Invitation)
          ------------------------------------------------------------- */}
      <section
        data-template-section="opening-envelope"
        className="wisuda-envelope"
        data-opened={opened ? "true" : "false"}
      >
        <div className="wisuda-envelope-stars-bg" />

        <div className="wisuda-envelope-card">
          <div className="wisuda-envelope-cap-badge">
            <GraduationCap size={32} className="wisuda-envelope-cap-icon" />
          </div>

          <span className="wisuda-envelope-kicker">
            GRADUATION INVITATION
          </span>

          <h1 className="wisuda-envelope-title" data-field="title">
            Undangan Wisuda
          </h1>

          <h2 className="wisuda-envelope-graduate" data-field="graduateName">
            Anindya Putri Rahayu, S.Kom
          </h2>

          <p className="wisuda-envelope-university" data-field="university">
            Universitas Indonesia
          </p>

          <div className="wisuda-envelope-guest-box">
            <span className="wisuda-envelope-guest-label" data-field="subtitle">
              Kepada Yth. Bapak/Ibu/Saudara/i:
            </span>
            <div className="wisuda-envelope-guest-name">
              {guestDisplayName}
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenInvitation}
            className="wisuda-open-btn"
          >
            <GraduationCap size={18} />
            <span data-field="buttonLabel">Buka Undangan</span>
            <Sparkles size={16} />
          </button>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. HERO SECTION (Clean White Background & Festive SVG Assets)
          ------------------------------------------------------------- */}
      <section data-template-section="hero" className="wisuda-hero">
        {/* Festive Celebratory SVG Assets Layer (Ramai & Ceria) */}
        <div className="wisuda-hero-decorations" aria-hidden="true">
          {/* Flying Toga Cap Left with Motion Swoosh */}
          <div className="wisuda-hero-svg-wrap cap-left">
            <svg viewBox="0 0 70 60" className="wisuda-hero-svg-cap" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 40 C16 48 24 50 32 50" stroke="#ec4899" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" opacity="0.85" />
              <path d="M6 32 C12 40 18 44 26 45" stroke="#06b6d4" strokeWidth="1.8" strokeDasharray="2 2" strokeLinecap="round" opacity="0.75" />
              <path d="M35 12 L60 25 L35 38 L10 25 Z" fill="url(#heroCapGrad1)" stroke="#312e81" strokeWidth="1.5" />
              <path d="M22 31 C22 40 48 40 48 31" fill="#1e1b4b" />
              <circle cx="35" cy="25" r="3" fill="#f59e0b" />
              <path d="M35 25 Q45 28 47 40" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="47" cy="41" r="2.5" fill="#d97706" />
              <path d="M52 8 L54 13 L59 15 L54 17 L52 22 L50 17 L45 15 L50 13 Z" fill="#f59e0b" />
              <defs>
                <linearGradient id="heroCapGrad1" x1="10" y1="12" x2="60" y2="38" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#312e81" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Flying Toga Cap Right */}
          <div className="wisuda-hero-svg-wrap cap-right">
            <svg viewBox="0 0 65 55" className="wisuda-hero-svg-cap-small" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M52 35 C46 44 38 46 30 46" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" opacity="0.85" />
              <path d="M32 10 L54 22 L32 34 L10 22 Z" fill="url(#heroCapGrad2)" stroke="#701a75" strokeWidth="1.5" />
              <path d="M20 28 C20 36 44 36 44 28" fill="#581c87" />
              <circle cx="32" cy="22" r="2.8" fill="#f59e0b" />
              <path d="M32 22 Q24 25 22 36" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <circle cx="22" cy="37" r="2" fill="#d97706" />
              <path d="M8 8 L9.5 12 L13.5 13.5 L9.5 15 L8 19 L6.5 15 L2.5 13.5 L6.5 12 Z" fill="#ec4899" />
              <defs>
                <linearGradient id="heroCapGrad2" x1="10" y1="10" x2="54" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a855f7" />
                  <stop offset="1" stopColor="#701a75" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Diploma Scroll Left */}
          <div className="wisuda-hero-svg-wrap diploma-left">
            <svg viewBox="0 0 60 60" className="wisuda-hero-svg-diploma" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="15" y="12" width="30" height="36" rx="4" transform="rotate(-18 30 30)" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.8" />
              <line x1="22" y1="22" x2="38" y2="17" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="24" y1="28" x2="40" y2="23" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="26" y1="34" x2="37" y2="30" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
              <rect x="25" y="16" width="9" height="38" rx="2" transform="rotate(-18 29 35)" fill="#f43f5e" />
              <path d="M29 42 L25 50 L30 47 L35 50 L31 42 Z" fill="#e11d48" />
              <circle cx="46" cy="14" r="4" fill="#fbbf24" opacity="0.9" />
              <path d="M46 8 L47.5 12 L51.5 13.5 L47.5 15 L46 19 L44.5 15 L40.5 13.5 L44.5 12 Z" fill="#f59e0b" />
            </svg>
          </div>

          {/* Streamers Left & Right */}
          <div className="wisuda-hero-svg-wrap streamer-left">
            <svg viewBox="0 0 50 120" className="wisuda-hero-svg-streamer" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 0 C10 20 40 35 25 55 C10 75 40 90 25 110" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              <path d="M15 15 C30 30 5 45 20 60 C5 75 30 90 15 105" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              <circle cx="35" cy="20" r="3.5" fill="#f59e0b" />
              <circle cx="12" cy="45" r="2.5" fill="#8b5cf6" />
              <circle cx="38" cy="80" r="3" fill="#10b981" />
            </svg>
          </div>

          <div className="wisuda-hero-svg-wrap streamer-right">
            <svg viewBox="0 0 50 120" className="wisuda-hero-svg-streamer" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 0 C40 20 10 35 25 55 C40 75 10 90 25 110" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              <path d="M35 15 C20 30 45 45 30 60 C45 75 20 90 35 105" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
              <circle cx="15" cy="25" r="3.5" fill="#ec4899" />
              <circle cx="36" cy="50" r="2.5" fill="#3b82f6" />
              <circle cx="16" cy="85" r="3" fill="#f59e0b" />
            </svg>
          </div>

          {/* Festive Radiance Ring behind showcase */}
          <div className="wisuda-hero-svg-wrap radiance-center">
            <svg viewBox="0 0 320 320" className="wisuda-hero-svg-radiance" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="160" cy="160" r="140" stroke="url(#heroRadGrad)" strokeWidth="1.5" strokeDasharray="4 8" opacity="0.45" />
              <circle cx="160" cy="160" r="115" stroke="url(#heroRadGrad2)" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.35" />
              <path d="M160 10 L163 18 L171 21 L163 24 L160 32 L157 24 L149 21 L157 18 Z" fill="#f59e0b" opacity="0.9" />
              <path d="M290 110 L292 116 L298 118 L292 120 L290 126 L288 120 L282 118 L288 116 Z" fill="#ec4899" opacity="0.9" />
              <path d="M30 120 L32 126 L38 128 L32 130 L30 136 L28 130 L22 128 L28 126 Z" fill="#06b6d4" opacity="0.9" />
              <path d="M280 230 L282 235 L287 237 L282 239 L280 244 L278 239 L273 237 L278 235 Z" fill="#8b5cf6" opacity="0.9" />
              <path d="M45 220 L47 225 L52 227 L47 229 L45 234 L43 229 L38 227 L43 225 Z" fill="#f59e0b" opacity="0.9" />
              <defs>
                <linearGradient id="heroRadGrad" x1="0" y1="0" x2="320" y2="320" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ec4899" />
                  <stop offset="0.5" stopColor="#6366f1" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="heroRadGrad2" x1="320" y1="0" x2="0" y2="320" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f59e0b" />
                  <stop offset="0.5" stopColor="#ec4899" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Top: Celebration Badge */}
        <div className="wisuda-hero-badge-wrap">
          <span className="wisuda-hero-badge" data-field="kicker">
            🎉 Momen Kelulusan &amp; Selebrasi 🎉
          </span>
        </div>

        {/* Centerpiece: 3D Showcase Card with Floating Stickers */}
        <div className="wisuda-hero-showcase">
          <div className="wisuda-hero-sticker top-right">
            <GraduationCap size={15} />
            <span data-field="degree">S.Kom</span>
          </div>
          <div className="wisuda-hero-showcase-card">
            <img
              src=""
              alt="Foto Wisudawati"
              className="wisuda-hero-portrait-img"
              data-single-img
              style={{ display: "none" }}
            />
            <div className="wisuda-hero-empty-frame" data-single-img-empty>
              <div className="wisuda-hero-empty-inner">
                <div className="wisuda-hero-empty-icon-wrap">
                  <GraduationCap size={36} className="wisuda-hero-empty-cap" />
                </div>
                <span className="wisuda-hero-empty-title">Ruang Foto Wisudawan</span>
                <span className="wisuda-hero-empty-sub">Pilih foto wisuda dari Asset Manager</span>
              </div>
            </div>
          </div>
        </div>

        {/* Graduate Info: Name & Faculty */}
        <div className="wisuda-hero-info">
          <h2 className="wisuda-hero-name" data-field="graduateName">
            Anindya Putri Rahayu
          </h2>

          <div className="wisuda-hero-meta">
            <span data-field="faculty">
              Fakultas Ilmu Komputer · Sistem Informasi
            </span>
          </div>
        </div>

        {/* Interactive Party Trumpet & Confetti Blaster */}
        <div className="wisuda-popper-wrapper">
          <div
            className="wisuda-popper-popup"
            onClick={handleFireConfetti}
            role="button"
            tabIndex={0}
          >
            <span>✨ Klik disini!</span>
            <span className="wisuda-popper-popup-arrow" />
          </div>
          <button
            ref={popperBtnRef}
            type="button"
            onClick={handleFireConfetti}
            className={`wisuda-popper-btn ${popperActive ? "is-active" : ""}`}
            title="Klik untuk tiup terompet & semburan konfeti!"
            aria-label="Tiup Terompet Konfeti"
          >
            <svg
              viewBox="0 0 48 48"
              className="wisuda-popper-icon"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Trumpet Horn pointing up-left */}
              <path
                d="M12 12C9 18 10 26 15 30L28 24L24 16L12 12Z"
                fill="url(#popperGold)"
                stroke="#d97706"
                strokeWidth="1.5"
              />
              <ellipse cx="13" cy="20" rx="3.5" ry="8" transform="rotate(-15 13 20)" fill="#ec4899" />
              <path
                d="M24 19L38 29C40 30.5 41 29 40 27.5L34 23L27 17"
                fill="#f59e0b"
                stroke="#b45309"
                strokeWidth="1.5"
              />
              <circle cx="39" cy="29" r="2.5" fill="#f43f5e" />
              <path d="M7 13L4 10M10 6L9 2M3 19L0 19" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="popperGold" x1="10" y1="12" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#fef08a" />
                  <stop offset="0.5" stopColor="#f59e0b" />
                  <stop offset="1" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
          </button>
        </div>

        {/* Bottom Scroll Hint */}
        <div className="wisuda-hero-scroll-hint">
          <p style={{ fontSize: "0.74rem", color: "#64748b", margin: 0 }} data-field="scrollHint">
            Gulir ke bawah untuk info selengkapnya
          </p>
          <ChevronDown size={18} style={{ color: "#6366f1", margin: "0.2rem auto 0" }} className="animate-bounce" />
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. QUOTE / UCAPAN SYUKUR SECTION
          ------------------------------------------------------------- */}
      <section data-template-section="quote" className="wisuda-section">
        <div className="wisuda-quote-card">
          <div className="wisuda-quote-mark">“</div>
          <p className="wisuda-section-kicker" data-field="title">
            Ungkapan Syukur & Apresiasi
          </p>
          <p className="wisuda-quote-text" data-field="quoteText">
            Tiada capaian terindah tanpa doa tulus orang tua, bimbingan para dosen tercinta, dan kebersamaan keluarga serta sahabat. Hari kelulusan ini adalah awal dari langkah baru menuju masa depan yang penuh berkah.
          </p>
          <p className="wisuda-quote-author" data-field="author">
            — Anindya Putri Rahayu, S.Kom
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------
          4. PROFILE SECTION (Colorful Academic Credentials)
          ------------------------------------------------------------- */}
      <section data-template-section="profile" className="wisuda-section">
        <div className="wisuda-section-header">
          <span className="wisuda-section-kicker">BIODATA AKADEMIK</span>
          <h2 className="wisuda-section-title" data-field="title">
            Profil Wisudawati
          </h2>
          <div className="wisuda-divider">
            <div className="wisuda-divider-line" />
            <Award size={14} className="wisuda-divider-icon" />
            <div className="wisuda-divider-line right" />
          </div>
        </div>

        <div className="wisuda-profile-card">
          <div className="wisuda-profile-header">
            <div className="wisuda-profile-avatar-wrap">
              <img
                src=""
                alt="Avatar Profile"
                className="wisuda-profile-avatar"
                data-single-img
                style={{ display: "none" }}
              />
              <div className="wisuda-profile-avatar-empty" data-profile-avatar-empty>
                <User size={24} />
              </div>
            </div>
            <div className="wisuda-profile-info">
              <h3 className="wisuda-profile-name" data-field="graduateName">
                Anindya Putri Rahayu, S.Kom
              </h3>
              <p className="wisuda-profile-degree" data-field="degree">
                Sarjana Komputer (S.Kom)
              </p>
            </div>
          </div>

          <div className="wisuda-profile-grid">
            <div className="wisuda-profile-card-item">
              <School size={13} className="wisuda-profile-item-icon" />
              <span className="wisuda-profile-card-label">Universitas</span>
              <span className="wisuda-profile-card-val" data-field="university">
                Universitas Indonesia
              </span>
            </div>
            <div className="wisuda-profile-card-item">
              <Building size={13} className="wisuda-profile-item-icon" />
              <span className="wisuda-profile-card-label">Fakultas</span>
              <span className="wisuda-profile-card-val" data-field="faculty">
                Fakultas Ilmu Komputer
              </span>
            </div>
            <div className="wisuda-profile-card-item">
              <BookOpen size={13} className="wisuda-profile-item-icon" />
              <span className="wisuda-profile-card-label">Program Studi</span>
              <span className="wisuda-profile-card-val" data-field="major">
                Sistem Informasi
              </span>
            </div>
            <div className="wisuda-profile-card-item">
              <Award size={13} className="wisuda-profile-item-icon" />
              <span className="wisuda-profile-card-label">Jenjang Pendidikan</span>
              <span className="wisuda-profile-card-val">
                Program Sarjana (S1)
              </span>
            </div>
          </div>

          <div className="wisuda-profile-period-banner" data-field="period">
            Wisuda Program Sarjana Periode Genap 2025/2026
          </div>
        </div>
      </section>
      
      {/* -------------------------------------------------------------
          5. EVENT SECTION (Simple & Modern Gala Schedule)
          ------------------------------------------------------------- */}
      <section data-template-section="event" className="wisuda-section">
        <div className="wisuda-section-header">
          <span className="wisuda-section-kicker">WAKTU & LOKASI</span>
          <h2 className="wisuda-section-title" data-field="title">
            Rangkaian Acara
          </h2>
          <p className="wisuda-section-subtitle" data-field="subtitle">
            Jadwal prosesi upacara kelulusan wisuda
          </p>
          <div className="wisuda-divider">
            <div className="wisuda-divider-line" />
            <Clock size={13} className="wisuda-divider-icon" />
            <div className="wisuda-divider-line right" />
          </div>
        </div>

        {/* Modern Minimalist Countdown */}
        <div className="wisuda-event-countdown-card">
          <div className="wisuda-event-countdown-header">
            <Clock size={13} className="wisuda-event-countdown-icon" />
            <span>Hitung Mundur Acara</span>
          </div>
          <div className="wisuda-countdown">
            <div className="wisuda-countdown-box">
              <span className="wisuda-countdown-val">{countdown.days}</span>
              <span className="wisuda-countdown-label">Hari</span>
            </div>
            <div className="wisuda-countdown-box">
              <span className="wisuda-countdown-val">{countdown.hours}</span>
              <span className="wisuda-countdown-label">Jam</span>
            </div>
            <div className="wisuda-countdown-box">
              <span className="wisuda-countdown-val">{countdown.minutes}</span>
              <span className="wisuda-countdown-label">Menit</span>
            </div>
            <div className="wisuda-countdown-box">
              <span className="wisuda-countdown-val">{countdown.seconds}</span>
              <span className="wisuda-countdown-label">Detik</span>
            </div>
          </div>
        </div>

        {/* Single Event Card - Luxurious Modern Graduation Style */}
        <div className="wisuda-event-card modern-gala">
          {/* Event Title */}
          <h3 className="wisuda-event-title" data-field="ceremonyName">
            Upacara Wisuda
          </h3>

          {/* Luxury Date & Time Feature Banner */}
          <div className="wisuda-event-date-banner">
            <div className="wisuda-event-date-box">
              <span className="wisuda-event-date-day">Sabtu</span>
              <span className="wisuda-event-date-num">17</span>
              <span className="wisuda-event-date-month">Okt 2026</span>
            </div>
            <div className="wisuda-event-time-box">
              <div className="wisuda-event-time-header">
                <Clock size={14} className="wisuda-event-time-icon" />
                <span>Waktu Prosesi</span>
              </div>
              <div className="wisuda-event-time-val" data-field="ceremonyTime">
                08.00 - 11.30 WIB
              </div>
              <span className="wisuda-event-time-note">Diharapkan hadir 30 menit sebelum acara</span>
            </div>
          </div>

          {/* Venue & Location Row */}
          <div className="wisuda-event-venue-card">
            <div className="wisuda-event-venue-icon-wrap">
              <MapPin size={17} />
            </div>
            <div className="wisuda-event-venue-text">
              <span className="wisuda-event-venue-label">Gedung / Lokasi</span>
              <span className="wisuda-event-venue-name" data-field="ceremonyVenue">
                Balairung Utama Universitas Indonesia
              </span>
              <span className="wisuda-event-venue-sub">
                Kampus UI Depok, Jawa Barat
              </span>
            </div>
          </div>

          {/* Dual Action Buttons: Simpan ke Kalender & Buka Google Maps */}
          <div className="wisuda-event-actions">
            <a
              href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Upacara+Wisuda+Anindya+Putri+Rahayu&dates=20261017T010000Z/20261017T043000Z&details=Upacara+Wisuda+dan+Kelulusan+Anindya+Putri+Rahayu%2C+S.Kom&location=Balairung+Utama+Universitas+Indonesia%2C+Depok"
              target="_blank"
              rel="noreferrer"
              className="wisuda-event-btn calendar-btn"
              data-calendar-link
            >
              <CalendarPlus size={16} />
              <span data-field="calendarLabel">Simpan ke Kalender</span>
            </a>

            <a
              href="https://maps.app.goo.gl/wKxJ8Lh8D3H5N9Vq8"
              target="_blank"
              rel="noreferrer"
              className="wisuda-event-btn map-btn"
              data-ceremony-map-link
              data-map-link
            >
              <MapPin size={15} />
              <span data-field="ceremonyMapLabel">Buka Google Maps</span>
              <ExternalLink size={13} className="wisuda-btn-external" />
            </a>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          6. GALLERY SECTION
          ------------------------------------------------------------- */}
      <section data-template-section="gallery" className="wisuda-section">
        <div className="wisuda-section-header">
          <span className="wisuda-section-kicker">DOKUMENTASI</span>
          <h2 className="wisuda-section-title" data-field="title">
            Momen & Kenangan
          </h2>
          <p className="wisuda-section-subtitle" data-field="subtitle">
            Kenangan indah selama masa studi hingga hari kelulusan yang membanggakan
          </p>
          <div className="wisuda-divider">
            <div className="wisuda-divider-line" />
            <ImageIcon size={13} className="wisuda-divider-icon" />
            <div className="wisuda-divider-line right" />
          </div>
        </div>

        <div className="wisuda-gallery-grid">
          {[
            { label: "Momen Wisuda", sub: "Pemindahan Kuncir" },
            { label: "Bersama Orang Tua", sub: "Ungkapan Terima Kasih" },
            { label: "Rekan Seperjuangan", sub: "Kenangan Almamater" },
            { label: "Selebrasi Kelulusan", sub: "Momen Bersejarah" },
          ].map((item, idx) => {
            const url = galleryPhotos[idx];
            return (
              <div
                key={idx}
                className="wisuda-gallery-item"
                data-gallery-item
                onClick={() => url && setLightboxIndex(idx)}
              >
                {url ? (
                  <>
                    <img
                      src={url}
                      alt={item.label}
                      className="wisuda-gallery-thumb"
                      data-gallery-img
                    />
                    <div className="wisuda-gallery-overlay">
                      <Camera size={18} className="wisuda-gallery-icon" />
                      <span className="wisuda-gallery-label">{item.label}</span>
                      <span className="wisuda-gallery-sub">{item.sub}</span>
                    </div>
                  </>
                ) : (
                  <div className={`wisuda-gallery-empty-frame frame-${idx}`}>
                    <div className="wisuda-gallery-corner tl">✦</div>
                    <div className="wisuda-gallery-corner tr">✦</div>
                    <div className="wisuda-gallery-corner bl">✦</div>
                    <div className="wisuda-gallery-corner br">✦</div>
                    <div className="wisuda-gallery-empty-inner">
                      <div className="wisuda-gallery-empty-icon">
                        <Camera size={18} />
                      </div>
                      <span className="wisuda-gallery-empty-label">{item.label}</span>
                      <span className="wisuda-gallery-empty-sub">{item.sub}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Lightbox Modal */}
        {lightboxIndex !== null && galleryPhotos[lightboxIndex] && (
          <div
            className="wisuda-lightbox"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              type="button"
              className="wisuda-lightbox-close"
              onClick={() => setLightboxIndex(null)}
              aria-label="Tutup foto"
            >
              <X size={20} />
            </button>
            <img
              src={galleryPhotos[lightboxIndex]}
              alt="Enlarged gallery photo"
              className="wisuda-lightbox-img"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          7. WISHES / BUKU UCAPAN SECTION
          ------------------------------------------------------------- */}
      <section data-template-section="wishes" className="wisuda-section">
        <div className="wisuda-section-header">
          <span className="wisuda-section-kicker">DOA & HARAPAN</span>
          <h2 className="wisuda-section-title" data-field="title">
            Kirim Ucapan
          </h2>
          <p className="wisuda-section-subtitle" data-field="subtitle">
            Tinggalkan ucapan selamat dan doa terbaik untuk kelulusan wisudawati
          </p>
          <div className="wisuda-divider">
            <div className="wisuda-divider-line" />
            <MessageSquare size={13} className="wisuda-divider-icon" />
            <div className="wisuda-divider-line right" />
          </div>
        </div>

        <div className="wisuda-wishes-box">
          <form className="wisuda-wishes-form" onSubmit={handleSubmitWish}>
            <div className="wisuda-form-group">
              <label htmlFor="wish-name" className="wisuda-form-label">
                Nama Lengkap
              </label>
              <input
                id="wish-name"
                type="text"
                placeholder="Contoh: Budi Santoso & Rekan"
                className="wisuda-form-input"
                value={wishName}
                onChange={(e) => setWishName(e.target.value)}
                required
              />
            </div>

            <div className="wisuda-form-group">
              <label htmlFor="wish-msg" className="wisuda-form-label">
                Ucapan & Doa Terbaik
              </label>
              <textarea
                id="wish-msg"
                rows={3}
                placeholder="Tuliskan ucapan selamat wisuda dan doa terbaik..."
                className="wisuda-form-textarea"
                value={wishMessage}
                onChange={(e) => setWishMessage(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="wisuda-submit-btn"
              disabled={isSubmittingWish}
            >
              <Sparkles size={16} />
              <span>
                {isSubmittingWish ? "Mengirim Ucapan..." : "Kirimkan Ucapan"}
              </span>
            </button>
          </form>

          {/* List of Wishes */}
          <div className="wisuda-wishes-list">
            {wishes.map((item) => (
              <div key={item.id} className="wisuda-wish-item">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong className="wisuda-wish-name">{item.name}</strong>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--wisuda-muted)",
                    }}
                  >
                    {item.createdAt}
                  </span>
                </div>
                <p className="wisuda-wish-text">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          8. CLOSING SECTION
          ------------------------------------------------------------- */}
      <section data-template-section="closing" className="wisuda-section wisuda-closing">
        <img
          src=""
          alt="Closing Background Wisuda"
          className="wisuda-closing-bg"
          data-single-img
          style={{ display: "none" }}
        />
        <div className="wisuda-closing-overlay" />

        <div className="wisuda-closing-content">
          <div className="wisuda-closing-icon-badge">
            <GraduationCap size={30} />
          </div>
          <h2 className="wisuda-closing-title" data-field="title">
            Terima Kasih
          </h2>
          <p className="wisuda-closing-msg" data-field="message">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami sekeluarga atas kehadiran, dukungan, dan ucapan tulus dari Bapak/Ibu/Saudara/i sekalian.
          </p>
          <div className="wisuda-closing-sig-wrapper">
            <span className="wisuda-closing-sig-label">Salam Hangat & Penuh Syukur</span>
            <p className="wisuda-closing-sig" data-field="familySignature">
              Anindya Putri Rahayu, S.Kom & Keluarga Besar
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          FLOATING LEFT SIDEBAR (Active Section Tracker)
          ------------------------------------------------------------- */}
      {opened && (
        <nav className="wisuda-floating-sidebar" aria-label="Navigasi Undangan">
          <button
            type="button"
            onClick={() => navigateTo("hero")}
            className={`wisuda-sidebar-btn hero-btn ${activeNav === "hero" ? "active" : ""}`}
            title="Wisudawati"
            aria-label="Wisudawati"
          >
            <GraduationCap size={18} />
            <span className="wisuda-sidebar-tooltip">Wisudawati</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo("profile")}
            className={`wisuda-sidebar-btn profile-btn ${activeNav === "profile" ? "active" : ""}`}
            title="Profil Akademik"
            aria-label="Profil Akademik"
          >
            <User size={18} />
            <span className="wisuda-sidebar-tooltip">Profil</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo("event")}
            className={`wisuda-sidebar-btn event-btn ${activeNav === "event" ? "active" : ""}`}
            title="Rangkaian Acara"
            aria-label="Rangkaian Acara"
          >
            <Clock size={18} />
            <span className="wisuda-sidebar-tooltip">Acara</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo("gallery")}
            className={`wisuda-sidebar-btn gallery-btn ${activeNav === "gallery" ? "active" : ""}`}
            title="Galeri Kenangan"
            aria-label="Galeri Kenangan"
          >
            <ImageIcon size={18} />
            <span className="wisuda-sidebar-tooltip">Galeri</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo("wishes")}
            className={`wisuda-sidebar-btn wishes-btn ${activeNav === "wishes" ? "active" : ""}`}
            title="Kirim Ucapan"
            aria-label="Kirim Ucapan"
          >
            <MessageSquare size={18} />
            <span className="wisuda-sidebar-tooltip">Ucapan</span>
          </button>
        </nav>
      )}
    </main>
  );
}
