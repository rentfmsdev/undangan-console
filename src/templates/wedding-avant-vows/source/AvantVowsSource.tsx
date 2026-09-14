"use client";

import { FormEvent, PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { TouchParticleTrail } from "@/components/effects/TouchParticleTrail";
import type { TouchParticleConfig } from "@/components/effects/presets";
import { TemplateNavigationRuntime } from "@/templates/navigation/TemplateNavigationRuntime";
import { AvantVowsNavigationAdapter } from "../navigation-adapter";
import { trackMetaPixel } from "@/lib/meta-pixel";
import "./avant-vows.css";

type Props = { invitationId?: string; verifiedGuestName?: string };
type Attendance = "Hadir" | "Belum pasti" | "Berhalangan hadir";
type Wish = { id: string; name: string; attendance: Attendance; message: string };

const navigation = [
  ["hero", "Cover"], ["couple", "People"], ["event", "Date"], ["story", "Story"], ["gallery", "Photos"], ["gift", "Gift"], ["wishes", "Notes"], ["closing", "End"],
] as const;

const createNavigationAdapter = () => new AvantVowsNavigationAdapter();

const AVANT_TOUCH_PARTICLES: TouchParticleConfig = {
  preset: "editorial",
  colors: ["var(--av-text)", "var(--av-bg)", "var(--av-accent)"],
};

function SoundIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10v4h4l5 4V6l-5 4H5Z"/><path d="M17 9c1.8 1.6 1.8 4.4 0 6M19.5 6.5c3.4 3 3.4 8 0 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10v4h4l5 4V6l-5 4H5Z"/><path d="m17 10 5 5m0-5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  );
}

function PhotoSlot({ slot, label }: { slot?: number; label: string }) {
  return <div className="av-photo-slot"><img data-image data-image-slot={slot} alt=""/><span>{label}</span></div>;
}

function AvantVowsSource({ invitationId, verifiedGuestName }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const swipeStartRef = useRef<number | null>(null);
  const [opened, setOpened] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set(navigation.map(([id]) => id)));
  const [gallery, setGallery] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<Attendance>("Hadir");
  const [wishName, setWishName] = useState(verifiedGuestName ?? "");
  const [wishMessage, setWishMessage] = useState("");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [eventFeedback, setEventFeedback] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [wishFeedback, setWishFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useCallback((sectionType: string) => {
    if (sectionType === "opening-envelope") {
      setOpened(false);
      rootRef.current?.scrollTo({ top: 0 });
      return;
    }
    setOpened(true);
    window.setTimeout(() => rootRef.current?.querySelector<HTMLElement>(`[data-template-section="${sectionType}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }, []);

  useEffect(() => {
    const onNavigate = (event: Event) => navigate((event as CustomEvent<{ sectionType: string }>).detail.sectionType);
    const onGallery = (event: Event) => {
      const urls = (event as CustomEvent<{ urls?: unknown }>).detail.urls;
      if (!Array.isArray(urls)) return;
      const next = urls.filter((url): url is string => typeof url === "string" && Boolean(url.trim())).slice(0, 4);
      setGallery(next);
      setLightboxIndex((current) => current !== null && current >= next.length ? null : current);
    };
    const onVisibility = (event: Event) => setVisibleSections(new Set((event as CustomEvent<{ enabled: string[] }>).detail.enabled));
    window.addEventListener("avant-vows-navigate", onNavigate);
    window.addEventListener("avant-vows-gallery", onGallery);
    window.addEventListener("avant-vows-section-visibility", onVisibility);
    return () => {
      window.removeEventListener("avant-vows-navigate", onNavigate);
      window.removeEventListener("avant-vows-gallery", onGallery);
      window.removeEventListener("avant-vows-section-visibility", onVisibility);
    };
  }, [navigate]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !opened) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-template-section]"));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting)), { root, threshold: 0.08 });
    sections.forEach((section) => observer.observe(section));
    const onScroll = () => {
      const marker = root.getBoundingClientRect().top + root.clientHeight * .44;
      const enabled = sections.filter((section) => !section.hidden && getComputedStyle(section).display !== "none");
      const current = enabled.reduce((active, section) => section.getBoundingClientRect().top <= marker ? section.dataset.templateSection ?? active : active, enabled[0]?.dataset.templateSection ?? "hero");
      setActiveSection(current);
    };
    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => { observer.disconnect(); root.removeEventListener("scroll", onScroll); };
  }, [opened]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowRight") setLightboxIndex((value) => value === null ? null : (value + 1) % gallery.length);
      if (event.key === "ArrowLeft") setLightboxIndex((value) => value === null ? null : (value - 1 + gallery.length) % gallery.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gallery.length, lightboxIndex]);

  useEffect(() => {
    if (!invitationId) return;
    const controller = new AbortController();
    fetch(`/api/wishes?invitationId=${encodeURIComponent(invitationId)}`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : { wishes: [] })
      .then((payload) => { if (!controller.signal.aborted && Array.isArray(payload.wishes)) setWishes(payload.wishes); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [invitationId]);

  const openInvitation = () => {
    setOpened(true);
    const audio = audioRef.current;
    const source = audio?.querySelector("source")?.getAttribute("src");
    if (audio && source) void audio.play().then(() => setMusicPlaying(true)).catch(() => undefined);
  };

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) { audio.pause(); setMusicPlaying(false); return; }
    const source = audio.querySelector("source")?.getAttribute("src");
    if (source) void audio.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
  };

  const copyAccount = async (field: string) => {
    const value = rootRef.current?.querySelector<HTMLElement>(`[data-template-section="gift"] [data-field="${field}"]`)?.textContent?.replace(/\s/g, "") ?? "";
    if (!value) return;
    try { await navigator.clipboard.writeText(value); setCopyFeedback("Nomor rekening berhasil disalin."); }
    catch { setCopyFeedback("Nomor rekening belum dapat disalin."); }
    window.setTimeout(() => setCopyFeedback(""), 2200);
  };

  const downloadCalendar = () => {
    const event = rootRef.current?.querySelector<HTMLElement>("[data-template-section=event]");
    const field = (key: string) => event?.querySelector<HTMLElement>(`[data-field="${key}"]`)?.textContent?.trim() ?? "";
    const date = field("date").match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    const months: Record<string, number> = { januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6, juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12 };
    const month = date ? months[date[2].toLowerCase()] : undefined;
    if (!date || !month) { setEventFeedback("Tanggal belum dapat dibaca untuk kalender."); return; }
    const time = field("akadTime").match(/(\d{1,2})[.:](\d{2})/);
    const hour = Number(time?.[1] ?? 8); const minute = Number(time?.[2] ?? 0);
    const stamp = `${date[3]}${String(month).padStart(2, "0")}${date[1].padStart(2, "0")}`;
    const escape = (value: string) => value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
    const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `UID:${Date.now()}@undangan.studio`, `DTSTART;TZID=Asia/Jakarta:${stamp}T${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`, `DTEND;TZID=Asia/Jakarta:${stamp}T${String(Math.min(hour + 2, 23)).padStart(2, "0")}${String(minute).padStart(2, "0")}00`, `SUMMARY:${escape(field("title"))}`, `LOCATION:${escape(`${field("venue")}, ${field("address")}`)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "avant-vows.ics"; link.click(); URL.revokeObjectURL(url);
    setEventFeedback("Kalender berhasil disiapkan.");
    window.setTimeout(() => setEventFeedback(""), 2200);
  };

  const submitWish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!wishName.trim() || !wishMessage.trim()) { setWishFeedback("Lengkapi nama dan ucapan terlebih dahulu."); return; }
    const next: Wish = { id: crypto.randomUUID(), name: wishName.trim(), attendance, message: wishMessage.trim() };
    setSubmitting(true); setWishFeedback("");
    try {
      if (!invitationId) setWishes((current) => [next, ...current]);
      else {
        const response = await fetch(`/api/wishes?invitationId=${encodeURIComponent(invitationId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: next.name, attendance: next.attendance, message: next.message }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Ucapan belum dapat dikirim.");
        setWishes((current) => [payload.wish ?? next, ...current]);
        trackMetaPixel("Lead", { content_category: "invitation_rsvp", content_id: invitationId, content_name: "wedding-avant-vows" });
      }
      setWishMessage(""); setWishFeedback("Ucapan Anda sudah masuk ke edisi kami.");
    } catch (error) { setWishFeedback(error instanceof Error ? error.message : "Ucapan belum dapat dikirim."); }
    finally { setSubmitting(false); }
  };

  const moveLightbox = (direction: number) => setLightboxIndex((current) => current === null || !gallery.length ? null : (current + direction + gallery.length) % gallery.length);
  const onLightboxPointerDown = (event: PointerEvent) => { swipeStartRef.current = event.clientX; };
  const onLightboxPointerUp = (event: PointerEvent) => {
    if (swipeStartRef.current === null) return;
    const distance = event.clientX - swipeStartRef.current; swipeStartRef.current = null;
    if (Math.abs(distance) > 45) moveLightbox(distance > 0 ? -1 : 1);
  };

  return <div className="avant-shell" data-use-container="true" data-opened={opened ? "true" : "false"}>
    <audio ref={audioRef} loop preload="metadata"><source src="/assets/audio/Until-I-Found-You-Piano-Cover.mp3" type="audio/mpeg"/></audio>
    <button className="av-sound" type="button" onClick={toggleMusic} aria-label={musicPlaying ? "Jeda musik" : "Putar musik"} aria-pressed={musicPlaying}><SoundIcon playing={musicPlaying}/></button>
    <main ref={rootRef} className="av-scroll" data-template-scroll-root data-template-hydrated="true" data-opened={opened ? "true" : "false"}>
      <section className="av-section av-hero" data-template-section="hero"><div className="av-running"><span>Avant vows / new beginning / </span><span>Avant vows / new beginning / </span></div><div className="av-cover-meta"><span data-field="issue">VOL. 01</span><b data-field="eyebrow">A love story worth printing</b></div><h1 data-field="title">Nara + Elang</h1><div className="av-cover-grid"><PhotoSlot label="Your cover photo"/><aside><span data-field="subtitle">14.11.2026 / Jakarta</span><img src="/assets/wedding/avant-vows/ribbon-arrow.svg" alt=""/></aside></div><div className="av-cover-footer"><p><span data-field="guestLabel">Edisi khusus untuk</span><strong data-field="guestName">{verifiedGuestName || "Tamu Undangan"}</strong></p><span data-field="scrollLabel">Baca kisah kami</span></div></section>

      <section className="av-section av-couple" data-template-section="couple"><header><span data-field="eyebrow">The people behind the vows</span><h2 data-field="title">Two names, one promise</h2><p data-field="intro">Dengan penuh syukur, kami memperkenalkan dua hati yang memilih berjalan menuju halaman yang sama.</p></header><div className="av-people"><article><PhotoSlot slot={0} label="Portrait 01"/><span data-field="brideLabel">01 / The Bride</span><h3 data-field="brideName">Nara Adelia</h3><p data-field="brideParents">Putri dari Bapak Arman dan Ibu Lestari</p></article><article><PhotoSlot slot={1} label="Portrait 02"/><span data-field="groomLabel">02 / The Groom</span><h3 data-field="groomName">Elang Pratama</h3><p data-field="groomParents">Putra dari Bapak Raka dan Ibu Sinta</p></article></div></section>

      <section className="av-section av-event" data-template-section="event"><div className="av-section-number">03</div><span className="av-kicker" data-field="eyebrow">Save the date</span><h2 data-field="title">One date, two promises</h2><p className="av-big-date" data-field="date">Sabtu, 14 November 2026</p><div className="av-times"><article><span data-field="akadLabel">Akad Nikah</span><strong data-field="akadTime">08.00 WIB</strong></article><article><span data-field="receptionLabel">Resepsi</span><strong data-field="receptionTime">11.00 - 14.00 WIB</strong></article></div><div className="av-venue"><small>Location / venue</small><h3 data-field="venue">The Glass House</h3><p data-field="address">Jl. Senopati No. 21, Jakarta Selatan</p><div><a data-map-link href="https://www.google.com/maps" target="_blank" rel="noreferrer"><span data-field="mapLabel">Buka Maps</span><b aria-hidden="true">↗</b></a><button type="button" onClick={downloadCalendar}><span data-field="calendarLabel">Simpan kalender</span><b aria-hidden="true">↓</b></button></div></div><aside className="av-dress"><span data-field="dressCodeLabel">Dress Code</span><strong data-field="dressCode">Monochrome + one bold accent</strong><p data-field="dressCodeNote">Kenakan versi terbaik diri Anda.</p></aside>{eventFeedback && <p className="av-feedback" role="status">{eventFeedback}</p>}</section>

      <section className="av-section av-story" data-template-section="story"><span className="av-kicker" data-field="eyebrow">The long read</span><h2 data-field="title">Ordinary days, extraordinary us</h2><p className="av-intro" data-field="subtitle">Tiga potongan kecil yang membawa kami sampai pada halaman ini.</p><div className="av-story-list">{[["firstDate","firstTitle","firstCopy"],["secondDate","secondTitle","secondCopy"],["thirdDate","thirdTitle","thirdCopy"]].map(([date,title,copy], index) => <article key={date}><b>0{index + 1}</b><time data-field={date}>{["2020","2023","2026"][index]}</time><div><h3 data-field={title}>{["First encounter","Same direction","The next chapter"][index]}</h3><p data-field={copy}>{["Pertemuan singkat yang ternyata menetap lebih lama dari yang kami kira.","Kami mulai menyusun mimpi yang tidak lagi memakai kata aku.","Kini kami mengundang Anda menjadi saksi halaman pertama perjalanan baru."][index]}</p></div></article>)}</div></section>

      <section className="av-section av-gallery" data-template-section="gallery"><span className="av-kicker" data-field="eyebrow">Contact sheet / 04</span><h2 data-field="title">Moments worth keeping</h2><p className="av-intro" data-field="subtitle">Empat bingkai untuk fragmen yang selalu ingin kami ingat.</p><div className="av-contact-sheet">{gallery.length ? gallery.map((url,index) => <button type="button" key={url} onClick={() => setLightboxIndex(index)}><img src={url} alt={`Foto galeri ${index + 1}`}/><span>0{index + 1}</span></button>) : [0,1,2,3].map((index) => <div key={index}><span>0{index + 1}</span><b data-field="emptyLabel">Your photograph</b></div>)}</div></section>

      <section className="av-section av-gift" data-template-section="gift"><span className="av-kicker" data-field="eyebrow">Registry desk</span><h2 data-field="title">Your presence is the present</h2><p className="av-intro" data-field="subtitle">Kehadiran dan doa Anda adalah hadiah terindah. Bila berkenan, tanda kasih dapat dikirim melalui detail berikut.</p><div className="av-gift-layout"><div className="av-bank-list" data-gift-bank-area><article><span data-field="bank1">BCA</span><strong data-field="account1">123 456 7890</strong><p data-field="holder1">a.n. Nara Adelia</p><button type="button" onClick={() => copyAccount("account1")} data-field="buttonLabel">Salin nomor</button></article><article data-gift-second-account><span data-field="bank2">Mandiri</span><strong data-field="account2">987 654 3210</strong><p data-field="holder2">a.n. Elang Pratama</p><button type="button" onClick={() => copyAccount("account2")} data-field="buttonLabel">Salin nomor</button></article></div><div className="av-qris" data-gift-qris-area><img data-gift-qris alt="Kode QRIS" hidden/><div data-gift-qris-placeholder>QR</div><span data-field="qrisLabel">Pindai QRIS</span></div></div>{copyFeedback && <p className="av-feedback" role="status">{copyFeedback}</p>}</section>

      <section className="av-section av-wishes" data-template-section="wishes"><span className="av-kicker" data-field="eyebrow">Letters to the couple</span><h2 data-field="title">Add your words to our story</h2><p className="av-intro" data-field="subtitle">Konfirmasi kehadiran dan tinggalkan doa yang akan kami simpan.</p><form onSubmit={submitWish}><input value={wishName} onChange={(event) => setWishName(event.target.value)} data-placeholder-field="namePlaceholder" placeholder="Nama Anda" required/><textarea value={wishMessage} onChange={(event) => setWishMessage(event.target.value)} data-placeholder-field="messagePlaceholder" placeholder="Tulis ucapan dan doa" required/><fieldset><legend data-field="attendanceLabel">Konfirmasi kehadiran</legend><div>{([['Hadir','attendancePresentLabel'],['Belum pasti','attendanceUnsureLabel'],['Berhalangan hadir','attendanceAbsentLabel']] as const).map(([value,field]) => <button type="button" key={value} data-field={field} className={attendance === value ? "is-active" : ""} aria-pressed={attendance === value} onClick={() => setAttendance(value)}>{value}</button>)}</div></fieldset><button type="submit" disabled={submitting} data-field="submitLabel">{submitting ? "Mengirim..." : "Kirim ucapan"}</button></form>{wishFeedback && <p className="av-feedback" role="status">{wishFeedback}</p>}<div className="av-notes">{wishes.map((wish,index) => <article key={wish.id}><b>#{String(index + 1).padStart(2,"0")}</b><strong>{wish.name}<span>{wish.attendance}</span></strong><p>{wish.message}</p></article>)}</div></section>

      <section className="av-section av-closing" data-template-section="closing"><img className="av-closing-grid" src="/assets/wedding/avant-vows/kinetic-grid.svg" alt=""/><span data-field="issue">END / BEGIN</span><p data-field="eyebrow">The final page</p><h2 data-field="title">Forever starts here</h2><p data-field="copy">Terima kasih telah hadir di halaman pertama perjalanan seumur hidup kami.</p><strong data-field="subtitle">Nara + Elang</strong></section>
    </main>
    <TouchParticleTrail rootRef={rootRef} config={AVANT_TOUCH_PARTICLES} enabled={opened} />

    <nav className="av-nav" aria-label="Navigasi undangan">{navigation.filter(([id]) => visibleSections.has(id)).map(([id,label],index) => <button type="button" key={id} className={activeSection === id ? "is-active" : ""} onClick={() => navigate(id)} aria-label={label}><b>{String(index + 1).padStart(2,"0")}</b><span>{label}</span></button>)}</nav>

    <section className="av-envelope" data-template-section="opening-envelope" aria-hidden={opened}><div className="av-envelope-top"/><div className="av-envelope-bottom"/><div className="av-envelope-card"><img src="/assets/wedding/avant-vows/editorial-bloom.svg" alt=""/><header><span data-field="issue">SPECIAL EDITION / 01</span><b data-field="eyebrow">A limited wedding edition</b></header><h1 data-field="title">Nara + Elang</h1><time data-field="date">14 November 2026</time><p><span data-field="guestLabel">Dipersiapkan khusus untuk</span><strong>{verifiedGuestName || "Tamu Undangan"}</strong></p><button type="button" onClick={openInvitation} data-field="sealLabel">Buka undangan</button></div></section>

    {lightboxIndex !== null && gallery[lightboxIndex] && <div className="av-lightbox" role="dialog" aria-modal="true" aria-label={`Foto ${lightboxIndex + 1} dari ${gallery.length}`} onPointerDown={onLightboxPointerDown} onPointerUp={onLightboxPointerUp} onClick={() => setLightboxIndex(null)}><button className="av-lightbox-close" type="button" onClick={() => setLightboxIndex(null)} aria-label="Tutup">×</button><button className="av-lightbox-prev" type="button" onClick={(event) => { event.stopPropagation(); moveLightbox(-1); }} aria-label="Sebelumnya">←</button><figure onClick={(event) => event.stopPropagation()}><img src={gallery[lightboxIndex]} alt={`Foto galeri ${lightboxIndex + 1}`}/><figcaption>{String(lightboxIndex + 1).padStart(2,"0")} / {String(gallery.length).padStart(2,"0")}</figcaption></figure><button className="av-lightbox-next" type="button" onClick={(event) => { event.stopPropagation(); moveLightbox(1); }} aria-label="Berikutnya">→</button></div>}
    <TemplateNavigationRuntime createAdapter={createNavigationAdapter}/>
  </div>;
}

export default AvantVowsSource;
