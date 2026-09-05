"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { TemplateNavigationRuntime } from "@/templates/navigation/TemplateNavigationRuntime";
import { EternalOrbitNavigationAdapter } from "../navigation-adapter";
import "./eternal-orbit.css";

type Props = { invitationId?: string; verifiedGuestName?: string };
type Attendance = "Hadir" | "Belum pasti" | "Berhalangan hadir";
type Wish = { id: string; name: string; message: string; attendance: Attendance };

const rail = [
  ["hero", "Beranda", "◉"], ["couple", "Mempelai", "♡"], ["event", "Acara", "◷"], ["story", "Cerita", "◌"], ["gallery", "Galeri", "▣"], ["gift", "Hadiah", "◇"], ["wishes", "Ucapan", "✎"], ["closing", "Penutup", "∞"],
] as const;

const createNavigationAdapter = () => new EternalOrbitNavigationAdapter();

function OrbitMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 260 260" fill="none" aria-hidden="true"><ellipse cx="130" cy="130" rx="118" ry="53" stroke="var(--eo-primary)" strokeWidth="1" opacity=".58"/><ellipse cx="130" cy="130" rx="84" ry="128" stroke="var(--eo-mid)" strokeWidth="1" opacity=".45" transform="rotate(34 130 130)"/><circle cx="130" cy="130" r="6" fill="var(--eo-accent)"/><circle cx="236" cy="117" r="3" fill="var(--eo-primary)"/><path d="M139 14a13 13 0 1 0 0 20 10 10 0 1 1 0-20Z" fill="var(--eo-accent)"/></svg>;
}

export default function EternalOrbitSource({ invitationId, verifiedGuestName }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const railTimerRef = useRef<number | null>(null);
  const [opened, setOpened] = useState(false);
  const [railVisible, setRailVisible] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set<string>(rail.map(([id]) => id)));
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [gallery, setGallery] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [wishName, setWishName] = useState(verifiedGuestName ?? "");
  const [wishMessage, setWishMessage] = useState("");
  const [attendance, setAttendance] = useState<Attendance>("Hadir");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const revealRail = useCallback(() => {
    setRailVisible(true);
    if (railTimerRef.current !== null) window.clearTimeout(railTimerRef.current);
    railTimerRef.current = window.setTimeout(() => {
      setRailVisible(false);
      railTimerRef.current = null;
    }, 2500);
  }, []);

  const openEnvelope = () => {
    setOpened(true);
    revealRail();
    audioRef.current?.play().then(() => setMusicOn(true)).catch(() => {});
  };

  const navigate = (sectionType: string) => {
    revealRail();
    if (sectionType === "opening-envelope") {
      setOpened(false);
      rootRef.current?.scrollTo({ top: 0 });
      return;
    }
    if (!opened) setOpened(true);
    window.setTimeout(() => rootRef.current?.querySelector<HTMLElement>(`[data-template-section="${sectionType}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  useEffect(() => {
    const onNavigate = (event: Event) => navigate((event as CustomEvent<{ sectionType: string }>).detail.sectionType);
    const onGallery = (event: Event) => setGallery((event as CustomEvent<{ urls: string[] }>).detail.urls);
    const onSections = (event: Event) => setVisibleSections(new Set((event as CustomEvent<{ enabled: string[] }>).detail.enabled));
    window.addEventListener("eternal-orbit-navigate", onNavigate);
    window.addEventListener("eternal-orbit-gallery", onGallery);
    window.addEventListener("eternal-orbit-section-visibility", onSections);
    return () => { window.removeEventListener("eternal-orbit-navigate", onNavigate); window.removeEventListener("eternal-orbit-gallery", onGallery); window.removeEventListener("eternal-orbit-section-visibility", onSections); };
  }, [opened]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !opened) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-orbit-reveal]"));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle("is-revealed", entry.isIntersecting)), { root, threshold: 0.18 });
    items.forEach((item) => observer.observe(item));
    const onScroll = () => {
      revealRail();
      const rootRect = root.getBoundingClientRect();
      const marker = rootRect.top + root.clientHeight * .42;
      const viewportCenter = rootRect.top + root.clientHeight / 2;
      items.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - viewportCenter) / root.clientHeight));
        section.style.setProperty("--eo-scroll-y", `${(-progress * 12).toFixed(2)}px`);
        section.style.setProperty("--eo-scroll-z", `${(-Math.abs(progress) * 90).toFixed(2)}px`);
        section.style.setProperty("--eo-scroll-tilt", `${(progress * -5).toFixed(2)}deg`);
      });
      const visible = rail.filter(([id]) => { const section = root.querySelector<HTMLElement>(`[data-template-section="${id}"]`); return section && !section.hidden && getComputedStyle(section).display !== "none"; });
      const current = visible.reduce<string>((active, [id]) => { const section = root.querySelector<HTMLElement>(`[data-template-section="${id}"]`); return section && section.getBoundingClientRect().top <= marker ? id : active; }, visible[0]?.[0] ?? "hero");
      setActiveSection(current);
    };
    onScroll(); root.addEventListener("scroll", onScroll, { passive: true });
    return () => { observer.disconnect(); root.removeEventListener("scroll", onScroll); };
  }, [opened, revealRail]);

  useEffect(() => () => {
    if (railTimerRef.current !== null) window.clearTimeout(railTimerRef.current);
  }, []);

  useEffect(() => {
    if (!invitationId) return;
    const controller = new AbortController();
    fetch(`/api/wishes?invitationId=${encodeURIComponent(invitationId)}`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : { wishes: [] })
      .then((payload) => { if (!controller.signal.aborted && Array.isArray(payload.wishes)) setWishes(payload.wishes); })
      .catch(() => {});
    return () => controller.abort();
  }, [invitationId]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowRight") setLightboxIndex((current) => current === null ? null : (current + 1) % gallery.length);
      if (event.key === "ArrowLeft") setLightboxIndex((current) => current === null ? null : (current - 1 + gallery.length) % gallery.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gallery.length, lightboxIndex]);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicOn) { audio.pause(); setMusicOn(false); }
    else audio.play().then(() => setMusicOn(true)).catch(() => {});
  };

  const copyAccount = async (field: string) => {
    const value = rootRef.current?.querySelector<HTMLElement>(`[data-template-section="gift"] [data-field="${field}"]`)?.textContent?.replace(/\s/g, "") ?? "";
    if (!value) return;
    try { await navigator.clipboard.writeText(value); setFeedback("Nomor rekening tersalin."); }
    catch { setFeedback("Nomor rekening belum dapat disalin."); }
    window.setTimeout(() => setFeedback(""), 2200);
  };

  const downloadCalendar = () => {
    const event = rootRef.current?.querySelector<HTMLElement>("[data-template-section=\"event\"]");
    const value = (field: string) => event?.querySelector<HTMLElement>(`[data-field="${field}"]`)?.textContent?.trim() ?? "";
    const dateText = value("date");
    const match = dateText.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    const monthIndex: Record<string, number> = { januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6, juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12 };
    const month = match ? monthIndex[match[2].toLowerCase()] : undefined;
    if (!match || !month) { setFeedback("Tanggal acara belum dapat dibaca untuk kalender."); return; }
    const time = value("akadTime").match(/(\d{1,2})[.:](\d{2})/);
    const hour = time ? Number(time[1]) : 8;
    const minute = time ? Number(time[2]) : 0;
    const start = `${match[3]}${String(month).padStart(2, "0")}${match[1].padStart(2, "0")}T${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;
    const endHour = (hour + 2) % 24;
    const end = `${match[3]}${String(month).padStart(2, "0")}${match[1].padStart(2, "0")}T${String(endHour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;
    const escapeIcs = (text: string) => text.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
    const calendar = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Undangan Studio//Eternal Orbit//ID", "BEGIN:VEVENT", `UID:${Date.now()}@undangan.studio`, `DTSTART;TZID=Asia/Jakarta:${start}`, `DTEND;TZID=Asia/Jakarta:${end}`, `SUMMARY:${escapeIcs(value("title") || "Undangan Pernikahan")}`, `LOCATION:${escapeIcs(`${value("venue")}, ${value("address")}`)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "undangan-eternal-orbit.ics"; link.click(); URL.revokeObjectURL(url);
  };

  const submitWish = async (event: FormEvent) => {
    event.preventDefault();
    if (!wishName.trim() || !wishMessage.trim()) { setFeedback("Tulis nama dan ucapan terlebih dahulu."); return; }
    const nextWish: Wish = { id: crypto.randomUUID(), name: wishName.trim(), message: wishMessage.trim(), attendance };
    setSubmitting(true); setFeedback("");
    try {
      if (invitationId) {
        const response = await fetch("/api/wishes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invitationId, name: nextWish.name, message: nextWish.message, attendance: nextWish.attendance }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Ucapan belum dapat dikirim.");
        setWishes((items) => [payload.wish ?? nextWish, ...items]);
      } else setWishes((items) => [nextWish, ...items]);
      setWishMessage(""); setFeedback("Terima kasih, ucapan Anda telah terkirim.");
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Ucapan belum dapat dikirim."); }
    finally { setSubmitting(false); }
  };

  return <div className="eternal-orbit-shell" data-use-container="true" data-opened={opened ? "true" : "false"}>
    <audio ref={audioRef} loop preload="metadata"><source src="/assets/audio/Can't-Help-Falling-In-Love-Piano-Version.mp3" type="audio/mpeg" /></audio>
    <main ref={rootRef} data-template-scroll-root data-template-hydrated="true" data-opened={opened ? "true" : "false"} className="eo-scroll">
      <button type="button" className="eo-audio" onClick={toggleMusic} aria-label={musicOn ? "Jeda musik" : "Putar musik"}>{musicOn ? "Ⅱ" : "♪"}</button>
      <section className="eo-section eo-hero" data-template-section="hero" data-orbit-reveal><OrbitMark className="eo-orbit eo-orbit-hero"/><div className="eo-starfield"/><p className="eo-kicker" data-field="eyebrow">A love written in the stars</p><div className="eo-hero-frame"><img data-image alt=""/><span>Foto Mempelai</span></div><h1 data-field="title">Nara &amp; Elang</h1><p className="eo-date" data-field="subtitle">14 November 2026 · Bandung</p><p className="eo-guest"><span data-field="guestLabel">Dengan penuh cinta, mengundang</span><strong data-field="guestName">Tamu Undangan</strong></p><span className="eo-scroll-hint" data-field="scrollLabel">Jelajahi kisah kami</span></section>

      <section className="eo-section eo-couple" data-template-section="couple" data-orbit-reveal><p className="eo-kicker" data-field="eyebrow">The couple</p><h2 data-field="title">Dua jiwa, satu orbit</h2><p className="eo-lead" data-field="intro">Dengan rasa syukur, kami memperkenalkan dua hati yang memilih pulang satu sama lain.</p><div className="eo-couple-grid"><article className="eo-person eo-tilt-left"><div className="eo-person-frame"><img data-image data-image-slot="0" alt=""/><span>Foto The Bride</span></div><small>The Bride</small><h3 data-field="brideName">Nara Adelia</h3><p data-field="brideParents">Putri dari Bapak Arman &amp; Ibu Lestari</p></article><article className="eo-person eo-tilt-right"><div className="eo-person-frame"><img data-image data-image-slot="1" alt=""/><span>Foto The Groom</span></div><small>The Groom</small><h3 data-field="groomName">Elang Pratama</h3><p data-field="groomParents">Putra dari Bapak Raka &amp; Ibu Sinta</p></article></div></section>

      <section className="eo-section eo-event" data-template-section="event" data-orbit-reveal><OrbitMark className="eo-orbit eo-orbit-event"/><p className="eo-kicker" data-field="eyebrow">Save the date</p><h2 data-field="title">Hari yang kami nantikan</h2><p className="eo-date" data-field="date">Sabtu, 14 November 2026</p><div className="eo-event-card"><article><span>Akad Nikah</span><strong data-field="akadTime">08.00 WIB</strong></article><article><span>Resepsi</span><strong data-field="receptionTime">11.00 – 14.00 WIB</strong></article></div><div className="eo-venue"><span>Lokasi</span><h3 data-field="venue">The Gaia Hotel</h3><p data-field="address">Jl. Dr. Setiabudi No. 430, Bandung</p><div><a data-map-link target="_blank" rel="noreferrer" href="https://www.google.com/maps"><span data-field="mapLabel">Buka Maps</span> ↗</a><button type="button" onClick={downloadCalendar}><span data-field="calendarLabel">Simpan kalender</span> ↧</button></div></div></section>

      <section className="eo-section eo-story" data-template-section="story" data-orbit-reveal><p className="eo-kicker" data-field="eyebrow">Our constellation</p><h2 data-field="title">Kisah yang terus berputar</h2><p className="eo-lead" data-field="subtitle">Tiga bab yang membawa kami pada satu janji.</p><div className="eo-timeline">{[["firstDate", "firstTitle", "firstCopy"], ["secondDate", "secondTitle", "secondCopy"], ["thirdDate", "thirdTitle", "thirdCopy"]].map(([date, title, copy], index) => <article key={date} className={`eo-timeline-card eo-card-${index + 1}`}><time data-field={date}>{index === 0 ? "2020" : index === 1 ? "2023" : "2026"}</time><div><h3 data-field={title}>{index === 0 ? "Berkenalan" : index === 1 ? "Menumbuhkan keyakinan" : "Menuju selamanya"}</h3><p data-field={copy}>{index === 0 ? "Sebuah percakapan sederhana membuka semesta baru." : index === 1 ? "Kami belajar memilih satu sama lain setiap hari." : "Dengan doa keluarga, kami memulai perjalanan baru."}</p></div></article>)}</div></section>

      <section className="eo-section eo-gallery" data-template-section="gallery" data-orbit-reveal><p className="eo-kicker" data-field="eyebrow">Captured in time</p><h2 data-field="title">Fragmen yang kami simpan</h2><p className="eo-lead" data-field="subtitle">Setiap gambar akan menjadi bagian dari perjalanan kami.</p><div className="eo-gallery-grid">{gallery.length ? gallery.map((url, index) => <button key={url} type="button" className={`eo-gallery-frame eo-gallery-${index % 4}`} onClick={() => setLightboxIndex(index)}><img src={url} alt={`Galeri ${index + 1}`} /></button>) : [0, 1, 2, 3].map((index) => <div key={index} className={`eo-gallery-frame eo-gallery-${index}`}><span>Foto pilihan</span></div>)}</div></section>

      <section className="eo-section eo-gift" data-template-section="gift" data-orbit-reveal><p className="eo-kicker" data-field="eyebrow">With gratitude</p><h2 data-field="title">Tanda kasih</h2><p className="eo-lead" data-field="subtitle">Kehadiran dan doa Anda adalah hadiah terbaik.</p><div className="eo-gift-grid"><div data-gift-bank-area className="eo-banks"><article><span data-field="bank1">BCA</span><strong data-field="account1">123 456 7890</strong><p data-field="holder1">a.n. Nara Adelia</p><button type="button" onClick={() => copyAccount("account1")}><span data-field="buttonLabel">Salin nomor</span></button></article><article data-gift-second-account><span data-field="bank2">DANA</span><strong data-field="account2">0812 3456 7890</strong><p data-field="holder2">a.n. Elang Pratama</p><button type="button" onClick={() => copyAccount("account2")}><span data-field="buttonLabel">Salin nomor</span></button></article></div><div data-gift-qris-area className="eo-qris"><img data-gift-qris alt="Kode QRIS" hidden/><div data-gift-qris-placeholder>QRIS</div><span data-field="qrisLabel">Scan QRIS tanda kasih</span></div></div>{feedback && <p className="eo-feedback" role="status">{feedback}</p>}</section>

      <section className="eo-section eo-wishes" data-template-section="wishes" data-orbit-reveal><p className="eo-kicker" data-field="eyebrow">Send your light</p><h2 data-field="title">Titipkan doa baik</h2><p className="eo-lead" data-field="subtitle">Kata-kata Anda akan menjadi kenangan yang selalu kami simpan.</p><form className="eo-wish-form" onSubmit={submitWish}><input value={wishName} onChange={(event) => setWishName(event.target.value)} data-placeholder-field="namePlaceholder" placeholder="Nama Anda"/><textarea value={wishMessage} onChange={(event) => setWishMessage(event.target.value)} data-placeholder-field="messagePlaceholder" placeholder="Tulis ucapan dan doa"/><fieldset><legend data-field="attendanceLabel">Konfirmasi kehadiran</legend><div>{([ ["Hadir", "attendancePresentLabel"], ["Belum pasti", "attendanceUnsureLabel"], ["Berhalangan hadir", "attendanceAbsentLabel"] ] as const).map(([value, field]) => <button key={value} type="button" className={attendance === value ? "is-selected" : ""} aria-pressed={attendance === value} onClick={() => setAttendance(value)} data-field={field}>{value}</button>)}</div></fieldset><button type="submit" disabled={submitting} data-field="submitLabel">{submitting ? "Mengirim…" : "Kirim ucapan"}</button></form>{feedback && <p className="eo-feedback" role="status">{feedback}</p>}<div className="eo-wish-list">{wishes.map((wish) => <article key={wish.id}><strong>{wish.name}<small>{wish.attendance}</small></strong><p>{wish.message}</p></article>)}</div></section>

      <section className="eo-section eo-closing" data-template-section="closing" data-orbit-reveal><img className="eo-closing-dove" src="/assets/wedding/merpati.png" alt=""/><OrbitMark className="eo-orbit eo-orbit-closing"/><p className="eo-kicker" data-field="eyebrow">Until we meet</p><h2 data-field="title">Terima kasih</h2><p data-field="copy">Terima kasih telah meluangkan waktu, doa, dan kehangatan untuk merayakan awal kisah kami.</p><strong data-field="subtitle">Nara &amp; Elang</strong></section>
    </main>
    <aside className="eo-rail" data-visible={railVisible ? "true" : "false"} aria-label="Navigasi undangan" onPointerEnter={revealRail} onFocusCapture={revealRail}>{rail.filter(([id]) => visibleSections.has(id)).map(([id, label, icon]) => <button key={id} type="button" className={activeSection === id ? "is-active" : ""} onClick={() => navigate(id)} aria-label={label}><span>{icon}</span><i>{label}</i></button>)}</aside>
    <section className="eo-envelope" data-template-section="opening-envelope" aria-hidden={opened}><div className="eo-envelope-card"><OrbitMark/><p data-field="eyebrow">The wedding of</p><h1 data-field="title">Nara &amp; Elang</h1><span data-field="date">Sabtu, 14 November 2026</span><small data-field="guestLabel">Kepada Yth.</small><strong>{verifiedGuestName || "Tamu Undangan"}</strong><button type="button" onClick={openEnvelope} data-field="sealLabel">Buka undangan</button></div></section>
    {lightboxIndex !== null && gallery[lightboxIndex] && <div className="eo-lightbox" role="dialog" aria-modal="true" onClick={() => setLightboxIndex(null)}><button type="button" aria-label="Tutup galeri">×</button><img src={gallery[lightboxIndex]} alt={`Galeri ${lightboxIndex + 1}`} onClick={(event) => event.stopPropagation()}/></div>}
    <TemplateNavigationRuntime createAdapter={createNavigationAdapter}/>
  </div>;
}
