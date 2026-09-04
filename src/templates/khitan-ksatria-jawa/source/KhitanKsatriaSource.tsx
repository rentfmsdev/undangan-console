"use client";

import React, { useEffect, useRef, useState } from "react";
import "./khitan.css";
import "./khitan-envelope.css";
import "./khitan-gallery.css";
import { KhitanConfetti, type ConfettiHandle } from "./KhitanConfetti";
import { Khitan3DGallery } from "./Khitan3DGallery";
import { KhitanCountdown } from "./KhitanCountdown";
import { TemplateNavigationRuntime, TEMPLATE_ACTIVE_EVENT, TEMPLATE_NAVIGATE_EVENT } from "@/templates/navigation/TemplateNavigationRuntime";
import { KhitanKsatriaNavigationAdapter } from "../navigation-adapter";

function createKhitanNavigationAdapter() {
  return new KhitanKsatriaNavigationAdapter();
}

const defaultGalleryImages = [
  "/assets/khitanan/1.jpeg",
  "/assets/khitanan/2.jpeg",
  "/assets/khitanan/3.jpeg",
  "/assets/khitanan/4.jpeg",
  "/assets/khitanan/5.jpeg",
  "/assets/khitanan/6.jpeg",
  "/assets/khitanan/7.jpeg",
];

export function KhitanKsatriaSource() {
  const [opened, setOpened] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [guestName, setGuestName] = useState("Tamu Undangan");
  const [galleryImages, setGalleryImages] = useState<string[]>(defaultGalleryImages);
  const activeGalleryImages = galleryImages.includes("/assets/khitanan/7.jpeg")
    ? galleryImages
    : [...galleryImages, "/assets/khitanan/7.jpeg"];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("hero");

  // Wishes state
  const [wishName, setWishName] = useState("");
  const [wishAttendance, setWishAttendance] = useState("Hadir");
  const [wishMessage, setWishMessage] = useState("");
  const [wishesList, setWishesList] = useState([
    { id: "1", name: "Bpk. H. Rahmat & Keluarga", attendance: "Hadir", message: "Barakallahu fiik untuk Ananda Arya. Semoga lekas sembuh, menjadi anak yang sholeh dan membanggakan keluarga." },
    { id: "2", name: "Keluarga Besar Sasana Keraton", attendance: "Hadir", message: "Selamat menempuh babak baru Ananda Arya. Semoga senantiasa dalam lindungan Allah SWT." },
    { id: "3", name: "Om Danang & Tante Dewi", attendance: "Hadir", message: "Gagah sekali mas Arya! Semoga menjadi ksatria yang berakhlak mulia dan sukses dunia akhirat." }
  ]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const confettiRef = useRef<ConfettiHandle | null>(null);

  // Extract query param `?for=...`
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const forParam = urlParams.get("for");
      if (forParam) {
        setGuestName(decodeURIComponent(forParam.replace(/\+/g, " ")));
      }
    }
  }, []);

  // All navigation sources (editor sidebar, preview navbar, and iframe scroll)
  // go through TemplateNavigationRuntime. This event only changes the envelope
  // state; the runtime owns scrolling the iframe's scroll root.
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

    window.addEventListener("khitan-preview-navigate", handlePreviewNavigate);
    window.addEventListener("khitan-gallery-update", handleGalleryUpdate);
    return () => {
      window.removeEventListener("khitan-preview-navigate", handlePreviewNavigate);
      window.removeEventListener("khitan-gallery-update", handleGalleryUpdate);
    };
  }, []);

  useEffect(() => {
    const handleActiveSection = (event: Event) => {
      const sectionType = (event as CustomEvent<{ sectionType?: string }>).detail?.sectionType;
      if (sectionType) setActiveNav(sectionType);
    };
    window.addEventListener(TEMPLATE_ACTIVE_EVENT, handleActiveSection);
    return () => window.removeEventListener(TEMPLATE_ACTIVE_EVENT, handleActiveSection);
  }, []);

  // Lightbox keyboard listener
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev !== null && prev < galleryImages.length - 1 ? prev + 1 : 0));
      if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : galleryImages.length - 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, galleryImages.length]);

  function handleOpenInvitation() {
    setOpened(true);
    confettiRef.current?.triggerBurst(85);
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }

  function handleCelebrationClick() {
    confettiRef.current?.triggerBurst(70);
  }

  function toggleAudio() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }

  function handleCopyAccount(acc: string, bankName: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(acc);
      setCopiedBank(bankName);
      setTimeout(() => setCopiedBank(null), 2500);
    }
  }

  function handleWishSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wishName.trim() || !wishMessage.trim()) return;
    setWishesList([
      { id: Date.now().toString(), name: wishName.trim(), attendance: wishAttendance, message: wishMessage.trim() },
      ...wishesList,
    ]);
    setWishName("");
    setWishMessage("");
    confettiRef.current?.triggerBurst(45);
  }

  function scrollToSection(sectionType: string) {
    window.dispatchEvent(
      new CustomEvent(TEMPLATE_NAVIGATE_EVENT, {
        detail: { sectionId: sectionType, requestId: crypto.randomUUID(), source: "preview-navbar" },
      })
    );
  }

  return (
    <main
      className="khitan-shell khitan-batik-pattern"
      data-template-scroll-root="true"
      data-template-hydrated="true"
      data-opened={opened ? "true" : "false"}
    >
      <TemplateNavigationRuntime createAdapter={createKhitanNavigationAdapter} />
      {/* Background Audio */}
      <audio ref={audioRef} loop preload="metadata">
        <source src="/assets/audio/INSTRUMENTAL-JAWA.mp3" type="audio/mpeg" />
      </audio>

      {/* Confetti Particle Canvas */}
      <KhitanConfetti ref={confettiRef} />

      {/* Floating Audio Button - Bottom Left */}
      {opened && (
        <button
          type="button"
          onClick={toggleAudio}
          className={`khitan-audio-btn ${isPlaying ? "is-playing" : ""}`}
          aria-label={isPlaying ? "Jeda Musik" : "Putar Musik"}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
          )}
        </button>
      )}

      {/* 1. Opening Envelope Screen with 3D Seal */}
      <section
        className={`khitan-envelope-screen ${opened ? "is-opened" : ""}`}
        data-template-section="opening-envelope"
        aria-hidden={opened}
      >
        {/* Decorative Royal Javanese Corner Ornaments */}
        <div className="khitan-env-corners" aria-hidden="true">
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-env-corner khitan-corner-tl" alt="" />
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-env-corner khitan-corner-tr" alt="" />
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-env-corner khitan-corner-bl" alt="" />
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-env-corner khitan-corner-br" alt="" />
        </div>

        {/* Ambient floating golden dust particles */}
        <div className="khitan-env-sparkles" aria-hidden="true">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="khitan-spark"
              style={{
                left: `${10 + i * 11}%`,
                top: `${20 + (i % 5) * 14}%`,
                width: `${3 + (i % 3) * 2}px`,
                height: `${3 + (i % 3) * 2}px`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${4.5 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        <div className="khitan-env-header">
          <p className="khitan-env-kicker" data-field="kicker">UNDANGAN WALIMATUL KHITAN</p>
          <h1 className="khitan-env-title" data-field="title">Walimatul Khitan</h1>
          <p className="khitan-env-subtitle" data-field="subtitle">Raden Mas Arya Pratama</p>
          <div className="khitan-env-divider-wrap" aria-hidden="true">
            <img src="/assets/khitanan/pembatas-kawung.svg" className="khitan-env-divider" alt="" />
          </div>
          <span className="khitan-env-date" data-field="date">Ahad, 15 November 2026</span>
        </div>

        <div className="khitan-env-card-wrap">
          <div className="khitan-env-seal-wrap">
            <img src="/assets/khitanan/gunungan-wayang.svg" alt="Segel Gunungan Emas" />
          </div>
          <div className="khitan-env-pocket">
            {/* Pocket Subtle Watermark */}
            <div className="khitan-pocket-watermark" aria-hidden="true">
              <img src="/assets/khitanan/gunungan-wayang.svg" alt="" />
            </div>
            {/* Pocket Mini Corner Accents */}
            <div className="khitan-pocket-corners" aria-hidden="true">
              <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-pocket-corner khitan-pocket-tl" alt="" />
              <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-pocket-corner khitan-pocket-tr" alt="" />
              <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-pocket-corner khitan-pocket-bl" alt="" />
              <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-pocket-corner khitan-pocket-br" alt="" />
            </div>
            <div className="khitan-pocket-content">
              <p className="khitan-env-guest-label">Kepada Yth. Bapak/Ibu/Saudara/i:</p>
              <h2 className="khitan-env-guest-name">{guestName}</h2>
              <p className="khitan-env-guest-note">Mohon maaf bila ada kesalahan penulisan nama/gelar</p>
            </div>
          </div>
        </div>

        <div className="khitan-env-footer">
          <button
            type="button"
            className="khitan-btn-open"
            onClick={handleOpenInvitation}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>Buka Undangan</span>
          </button>
          <p className="khitan-env-prompt">Sentuh tombol untuk membuka surat undangan</p>
        </div>
      </section>

      {/* 2. Hero Section (Mobile-First Deterministik 1 Layar Penuh) */}
      <section className="khitan-hero" data-template-section="hero">
        {/* Decorative Royal Corner Ornaments */}
        <div className="khitan-hero-corners" aria-hidden="true">
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-hero-corner khitan-hero-corner-tl" alt="" />
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-hero-corner khitan-hero-corner-tr" alt="" />
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-hero-corner khitan-hero-corner-bl" alt="" />
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-hero-corner khitan-hero-corner-br" alt="" />
        </div>

        {/* Ambient floating golden dust particles */}
        <div className="khitan-ambient-dust" aria-hidden="true">
          {[...Array(10)].map((_, i) => (
            <span
              key={i}
              className="khitan-dust-spark"
              style={{
                left: `${10 + i * 9}%`,
                top: `${14 + (i % 6) * 12}%`,
                width: `${3 + (i % 3) * 2}px`,
                height: `${3 + (i % 3) * 2}px`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${5 + (i % 4)}s`,
              }}
            />
          ))}
        </div>

        <div className="khitan-hero-top">
          <p className="khitan-arabic-basmalah" data-field="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <p className="khitan-hero-kicker" data-field="kicker">✦ WALIMATUL KHITAN ✦</p>
          <div className="khitan-hero-guest">
            <span className="khitan-hero-guest-label">Kepada Yth. Bapak/Ibu/Saudara/i:</span>
            <span className="khitan-hero-guest-name">{guestName}</span>
          </div>
        </div>

        <div className="khitan-hero-avatar-wrap">
          <div className="khitan-hero-gunungan-crest" aria-hidden="true">
            <img src="/assets/khitanan/gunungan-wayang.svg" alt="" />
          </div>
          <div className="khitan-royal-arch-frame">
            <div className="khitan-royal-arch-inner">
              <img
                data-single-img="true"
                src="/assets/khitanan/1.jpeg"
                alt="Raden Mas Arya Pratama"
              />
            </div>
          </div>
        </div>

        <div className="khitan-hero-bottom">
          <h2 className="khitan-hero-title" data-field="title">Raden Mas Arya Pratama</h2>
          <div className="khitan-hero-divider-wrap" aria-hidden="true">
            <img src="/assets/khitanan/pembatas-kawung.svg" className="khitan-hero-divider" alt="" />
          </div>
          <p className="khitan-hero-date" data-field="date">Ahad, 15 November 2026</p>
          <p className="khitan-hero-copy" data-field="copy">
            Menunaikan Sunnah Rasulullah SAW demi Menjadi Generasi Shalih, Berbakti, dan Budi Pekerti Mulia.
          </p>
        </div>
      </section>

      {/* Royal Keraton Section Divider */}
      <div className="khitan-section-divider"><img src="/assets/khitanan/pembatas-keraton.svg" alt="" aria-hidden="true" /></div>

      {/* 3. Profile Section (Profil Ananda & Foto Bersama Orang Tua) */}
      <section className="khitan-section" data-template-section="profile">
        <div className="khitan-section-header">
          <span className="khitan-section-eyebrow" data-field="eyebrow">SANG KSATRIA KELUARGA</span>
          <h2 className="khitan-section-title" data-field="title">Profil Ananda Tercinta</h2>
        </div>

        <div className="khitan-profile-card khitan-card-with-corners">
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-corner-ornament khitan-corner-tl" alt="" aria-hidden="true" />
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-corner-ornament khitan-corner-tr" alt="" aria-hidden="true" />
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-corner-ornament khitan-corner-bl" alt="" aria-hidden="true" />
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-corner-ornament khitan-corner-br" alt="" aria-hidden="true" />

          {/* Foto Bersama Orang Tua / Profil Utama (Editable via section imageUrl) */}
          <div className="khitan-family-avatar">
            <img
              data-single-img="true"
              src="/assets/khitanan/7.jpeg"
              alt="Ananda Arya bersama Ayahanda dan Ibunda"
            />
          </div>

          <span className="khitan-family-badge">Keluarga Bahagia</span>
          <h3 className="khitan-profile-name" data-field="childName">Raden Mas Arya Pratama</h3>
          <span className="khitan-profile-nickname" data-field="nickname">Ananda Arya</span>
          <p className="khitan-profile-parents" data-field="parents">
            Putra Pertama dari Bpk. Bambang Wijaya & Ibu Siti Rahayu
          </p>
          <p className="khitan-family-desc" data-field="familyNote" style={{ marginTop: "8px" }}>
            Mendampingi ananda tercinta dalam balutan busana adat ageng Keraton Jawa penuh doa dan restu.
          </p>

          <p className="khitan-profile-doa" data-field="doa" style={{ marginTop: "14px" }}>
            “Semoga Allah SWT senantiasa melimpahkan taufik, hidayah, dan kesehatan, menjadikannya anak yang sholeh, berbakti kepada kedua orang tua, cerdas berakhlak, serta berguna bagi nusa, bangsa, dan agama.”
          </p>
        </div>
      </section>

      {/* Royal Keraton Section Divider */}
      <div className="khitan-section-divider"><img src="/assets/khitanan/pembatas-keraton.svg" alt="" aria-hidden="true" /></div>

      {/* 4. Event Section with Live Countdown Timer */}
      <section className="khitan-section" data-template-section="event">
        <div className="khitan-section-header">
          <span className="khitan-section-eyebrow" data-field="eyebrow">WAKTU & LOKASI SYUKURAN</span>
          <h2 className="khitan-section-title" data-field="title">Rangkaian Acara Khitanan</h2>
        </div>

        {/* Live Countdown Timer */}
        <KhitanCountdown targetDate="2026-11-15T08:30:00+07:00" />

        {/* Single Unified Event Card */}
        <div className="khitan-unified-event-card khitan-card-with-corners" style={{ marginTop: "20px" }}>
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-corner-ornament khitan-corner-tl" alt="" aria-hidden="true" />
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-corner-ornament khitan-corner-tr" alt="" aria-hidden="true" />
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-corner-ornament khitan-corner-bl" alt="" aria-hidden="true" />
          <img src="/assets/khitanan/ornamen-sudut-jawa.svg" className="khitan-corner-ornament khitan-corner-br" alt="" aria-hidden="true" />

          {/* Sesi Acara Tunggal */}
          <div className="khitan-event-session-block">
            <span className="khitan-event-badge" data-field="eventBadge">Syukuran Khitan</span>
            <h3 className="khitan-event-name" data-field="eventTitle">Doa Syukuran Khitan</h3>
            <div className="khitan-event-time">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span data-field="eventTime">Pukul 08.30 – 11.30 WIB</span>
            </div>
          </div>

          <div className="khitan-event-inner-divider"></div>

          {/* Lokasi & Alamat Bersama */}
          <div className="khitan-event-location-block">
            <h4 className="khitan-event-loc-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span data-field="locationName">Gedung Sasana Kriya Keraton</span>
            </h4>
            <p className="khitan-event-loc-address" data-field="address">
              Jl. Pangeran Antasari No. 88, Kedamaian, Kota Bandar Lampung
            </p>
          </div>
        </div>

        {/* Action Buttons: Dipisahkan di Luar Card */}
        <div className="khitan-event-actions-bar">
          <a
            data-map-link="true"
            data-field="mapLabel"
            href="https://maps.google.com/?q=Bandar+Lampung"
            target="_blank"
            rel="noreferrer"
            className="khitan-btn-event-action khitan-btn-map"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>Buka Google Maps</span>
          </a>

          <a
            data-calendar-link="true"
            data-field="calendarLabel"
            href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Walimatul%20Khitan%20Raden%20Mas%20Arya%20Pratama&dates=20261115T013000Z/20261115T070000Z&details=Doa%20Syukuran%20Khitan%20dan%20Walimah%20Ramah%20Tamah%20Raden%20Mas%20Arya%20Pratama&location=Gedung%20Sasana%20Kriya%20Keraton%2C%20Jl.%20Pangeran%20Antasari%20No.%2088%2C%20Kedamaian%2C%20Bandar%20Lampung"
            target="_blank"
            rel="noreferrer"
            className="khitan-btn-event-action khitan-btn-calendar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
            <span>Simpan ke Kalender</span>
          </a>
        </div>
      </section>

      {/* Royal Keraton Section Divider */}
      <div className="khitan-section-divider"><img src="/assets/khitanan/pembatas-keraton.svg" alt="" aria-hidden="true" /></div>

      {/* 5. Gallery Section with 3D Coverflow & Lightbox */}
      <section className="khitan-section" data-template-section="gallery">
        <div className="khitan-section-header">
          <span className="khitan-section-eyebrow" data-field="eyebrow">ALBUM KENANGAN</span>
          <h2 className="khitan-section-title" data-field="title">Galeri Sang Ksatria</h2>
          <p style={{ fontSize: "12px", color: "var(--khitan-muted)", marginTop: "4px" }} data-field="subtitle">
            Senyum, wibawa, dan langkah awal kedewasaan Ananda Arya.
          </p>
        </div>

        {/* 3D Coverflow Component */}
        <Khitan3DGallery
          images={activeGalleryImages}
          onOpenLightbox={(idx) => setLightboxIndex(idx)}
        />
      </section>

      {/* Royal Keraton Section Divider */}
      <div className="khitan-section-divider"><img src="/assets/khitanan/pembatas-keraton.svg" alt="" aria-hidden="true" /></div>

      {/* 6. Gift Section */}
      <section className="khitan-section" data-template-section="gift">
        <div className="khitan-section-header">
          <span className="khitan-section-eyebrow" data-field="eyebrow">TANDA KASIH & DOA</span>
          <h2 className="khitan-section-title" data-field="title">Kirim Hadiah Digital</h2>
          <p style={{ fontSize: "12px", color: "var(--khitan-muted)", marginTop: "4px", lineHeight: "1.5" }} data-field="subtitle">
            Kehadiran dan doa restu Bapak/Ibu/Saudara/i merupakan kebahagiaan tak terhingga bagi kami. Apabila berkenan memberikan tanda kasih bagi Ananda Arya, dapat melalui:
          </p>
        </div>

        {/* Bank 1 */}
        <div className="khitan-gift-card">
          <div className="khitan-bank-badge" data-field="bank">BANK BCA</div>
          <p className="khitan-bank-acc" data-field="account">7820 1829 90</p>
          <p className="khitan-bank-holder" data-field="holder">a.n. Bambang Wijaya (Ayah)</p>
          <button
            type="button"
            className="khitan-btn-copy"
            onClick={() => handleCopyAccount("7820182990", "BCA")}
          >
            {copiedBank === "BCA" ? "✓ Tersalin!" : "Salin Nomor Rekening"}
          </button>
        </div>

        {/* Bank 2 */}
        <div className="khitan-gift-card">
          <div className="khitan-bank-badge" data-field="bank2">BANK MANDIRI</div>
          <p className="khitan-bank-acc" data-field="account2">1140 0293 8472 1</p>
          <p className="khitan-bank-holder" data-field="holder2">a.n. Siti Rahayu (Ibu)</p>
          <button
            type="button"
            className="khitan-btn-copy"
            onClick={() => handleCopyAccount("1140029384721", "MANDIRI")}
          >
            {copiedBank === "MANDIRI" ? "✓ Tersalin!" : "Salin Nomor Rekening"}
          </button>
        </div>
      </section>

      {/* Royal Keraton Section Divider */}
      <div className="khitan-section-divider"><img src="/assets/khitanan/pembatas-keraton.svg" alt="" aria-hidden="true" /></div>

      {/* 7. Wishes Section */}
      <section className="khitan-section" data-template-section="wishes">
        <div className="khitan-section-header">
          <span className="khitan-section-eyebrow" data-field="eyebrow">UNTAIAN DOA RESTU</span>
          <h2 className="khitan-section-title" data-field="title">Buku Tamu & Ucapan</h2>
          <p style={{ fontSize: "12px", color: "var(--khitan-muted)", marginTop: "4px" }} data-field="subtitle">
            Tuliskan doa serta pesan hangat Anda untuk mengiringi langkah Ananda Arya.
          </p>
        </div>

        <div className="khitan-wishes-wrap">
          {/* Interactive Celebration Banner */}
          <div className="khitan-berkah-banner">
            <div className="khitan-berkah-header">
              <div className="khitan-berkah-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div className="khitan-berkah-info">
                <h4 className="khitan-berkah-title">Kirim Doa & Hujan Berkah</h4>
                <p className="khitan-berkah-desc">Sentuh untuk melantunkan doa berkah bagi Ananda Arya</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCelebrationClick}
              className="khitan-btn-berkah-action"
            >
              <span>🤲 Kirim Doa & Hujan Berkah ✨</span>
            </button>
          </div>

          <form onSubmit={handleWishSubmit}>
            <div className="khitan-form-group">
              <label htmlFor="wish-name">Nama Anda</label>
              <input
                id="wish-name"
                className="khitan-input"
                placeholder="Contoh: Bpk. H. Ahmad & Keluarga"
                value={wishName}
                onChange={(e) => setWishName(e.target.value)}
                required
              />
            </div>
            <div className="khitan-form-group">
              <label htmlFor="wish-attend">Konfirmasi Kehadiran</label>
              <select
                id="wish-attend"
                className="khitan-select"
                value={wishAttendance}
                onChange={(e) => setWishAttendance(e.target.value)}
              >
                <option value="Hadir">Insya Allah Hadir</option>
                <option value="Tidak Hadir">Mohon Maaf Belum Dapat Hadir</option>
                <option value="Ragu-ragu">Masih Belum Pasti</option>
              </select>
            </div>
            <div className="khitan-form-group">
              <label htmlFor="wish-msg">Untaian Doa / Ucapan</label>
              <textarea
                id="wish-msg"
                className="khitan-textarea"
                rows={3}
                placeholder="Tuliskan doa dan harapan terbaik untuk Ananda Arya..."
                value={wishMessage}
                onChange={(e) => setWishMessage(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="khitan-btn-submit">
              Kirim Doa & Ucapan
            </button>
          </form>

          {/* List of wishes */}
          <div className="khitan-wishes-list">
            {wishesList.map((item) => (
              <div key={item.id} className="khitan-wish-item">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="khitan-wish-author">{item.name}</span>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--khitan-accent)" }}>{item.attendance}</span>
                </div>
                <p className="khitan-wish-text">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Royal Keraton Section Divider */}
      <div className="khitan-section-divider"><img src="/assets/khitanan/pembatas-keraton.svg" alt="" aria-hidden="true" /></div>

      {/* 8. Closing Section with Gunungan Wayang (Footer) */}
      <section className="khitan-closing" data-template-section="closing">
        <img src="/assets/khitanan/gunungan-wayang.svg" className="khitan-gunungan-icon" alt="Gunungan Wayang" />
        <span className="khitan-section-eyebrow" data-field="eyebrow">JAZAKUMULLAH KHAIRAN KATSIRAN</span>
        <h2 className="khitan-closing-title" data-field="title">Matur Nuwun</h2>
        <p className="khitan-closing-sub" data-field="subtitle">
          Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu bagi Ananda tercinta.
        </p>
        <p className="khitan-closing-family" data-field="family">
          Keluarga Besar Bpk. Bambang Wijaya & Ibu Siti Rahayu
        </p>
      </section>

      {/* Fullscreen Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="khitan-lightbox-overlay"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="khitan-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="khitan-lightbox-close"
              onClick={() => setLightboxIndex(null)}
              aria-label="Tutup foto"
            >
              ✕
            </button>
            {activeGalleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="khitan-lightbox-nav khitan-lightbox-prev"
                  onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : activeGalleryImages.length - 1))}
                  aria-label="Foto sebelumnya"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="khitan-lightbox-nav khitan-lightbox-next"
                  onClick={() => setLightboxIndex((prev) => (prev !== null && prev < activeGalleryImages.length - 1 ? prev + 1 : 0))}
                  aria-label="Foto selanjutnya"
                >
                  ›
                </button>
              </>
            )}
            <div className="khitan-lightbox-img-wrap">
              <img src={activeGalleryImages[lightboxIndex]} alt={`Foto Ananda ${lightboxIndex + 1}`} />
            </div>
            <span className="khitan-lightbox-counter">
              {lightboxIndex + 1} / {activeGalleryImages.length}
            </span>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      {opened && (
        <nav className="khitan-bottom-nav" aria-label="Navigasi Undangan">
          <button
            type="button"
            className={`khitan-nav-item ${activeNav === "hero" ? "is-active" : ""}`}
            onClick={() => scrollToSection("hero")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <span>Awal</span>
          </button>
          <button
            type="button"
            className={`khitan-nav-item ${activeNav === "profile" ? "is-active" : ""}`}
            onClick={() => scrollToSection("profile")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Profil</span>
          </button>
          <button
            type="button"
            className={`khitan-nav-item ${activeNav === "event" ? "is-active" : ""}`}
            onClick={() => scrollToSection("event")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Acara</span>
          </button>
          <button
            type="button"
            className={`khitan-nav-item ${activeNav === "gallery" ? "is-active" : ""}`}
            onClick={() => scrollToSection("gallery")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>Galeri</span>
          </button>
          <button
            type="button"
            className={`khitan-nav-item ${activeNav === "gift" ? "is-active" : ""}`}
            onClick={() => scrollToSection("gift")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            <span>Kado</span>
          </button>
          <button
            type="button"
            className={`khitan-nav-item ${activeNav === "wishes" ? "is-active" : ""}`}
            onClick={() => scrollToSection("wishes")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>Doa</span>
          </button>
        </nav>
      )}
    </main>
  );
}
