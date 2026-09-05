"use client";

import { useEffect, useRef, useState } from "react";
import { TemplateNavigationRuntime } from "@/templates/navigation/TemplateNavigationRuntime";
import { VerdantVowsNavigationAdapter } from "../navigation-adapter";
import "./verdant-vows.css";

type Props = { invitationId?: string; verifiedGuestName?: string };
type Attendance = "Hadir" | "Belum pasti" | "Berhalangan hadir";
type Wish = { id: string; name: string; message: string; attendance: Attendance };

const rail = [
  ["hero", "Beranda", "✦"],
  ["couple", "Mempelai", "♡"],
  ["event", "Acara", "◷"],
  ["story", "Cerita", "✦"],
  ["gallery", "Galeri", "◫"],
  ["gift", "Hadiah", "⌁"],
  ["wishes", "Ucapan", "✎"],
  ["closing", "Penutup", "✦"],
] as const;

function BotanicalCorner({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 440"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="var(--vv-mid)"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 8C50 80 77 136 141 207C198 270 220 344 231 428" strokeWidth="2" />
        <path d="M42 58C68 48 88 30 100 8M57 91C35 88 17 73 8 52M89 137C117 130 139 113 151 89M113 165C93 166 74 156 61 139M151 220C181 215 204 198 215 174M174 253C153 253 132 243 119 225M199 308C226 304 246 287 256 264M213 346C197 347 178 338 166 321M224 391C250 388 272 370 282 347" strokeWidth="1.5" />
      </g>
      <g fill="var(--vv-accent)" opacity=".92">
        <path d="M100 8C77 9 58 25 50 48C73 47 93 30 100 8ZM8 52C30 52 48 68 57 91C35 91 16 74 8 52ZM151 89C127 91 108 108 89 137C112 137 137 116 151 89ZM61 139C84 139 104 150 113 165C91 166 71 155 61 139ZM215 174C190 176 170 195 151 220C176 220 202 199 215 174ZM119 225C143 225 164 238 174 253C152 254 132 243 119 225ZM256 264C233 266 213 283 199 308C222 308 246 289 256 264ZM166 321C187 321 207 334 213 346C194 348 176 338 166 321ZM282 347C259 350 239 368 224 391C248 391 271 372 282 347Z" />
      </g>
      <g fill="var(--vv-mid)" opacity=".38">
        <circle cx="44" cy="24" r="3" /><circle cx="133" cy="81" r="3" /><circle cx="81" cy="123" r="2.5" /><circle cx="197" cy="162" r="3" /><circle cx="132" cy="209" r="2.5" /><circle cx="240" cy="250" r="3" /><circle cx="183" cy="300" r="2.5" /><circle cx="270" cy="335" r="3" />
      </g>
    </svg>
  );
}

function VerdantDove({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 180 116" fill="none" aria-hidden="true">
      <g fill="var(--vv-surface)" stroke="var(--vv-mid)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
        <g transform="translate(79 55)">
          <g><path d="M0 6C-24-6-49-18-68-11C-47 1-25 13-3 16L0 6Z" /><animateTransform attributeName="transform" type="rotate" values="0 0 6;-14 0 6;0 0 6" dur="2.8s" repeatCount="indefinite" /></g>
          <g><path d="M3 8C21-15 42-28 62-24C49-7 31 11 8 18L3 8Z" /><animateTransform attributeName="transform" type="rotate" values="0 3 8;14 3 8;0 3 8" dur="2.8s" repeatCount="indefinite" /></g>
          <path d="M-7 7C2-7 24-7 34 5C40 13 37 25 27 30C19 34 5 30-4 22C-9 18-11 12-7 7Z" /><path d="M29 6C43-1 54 4 62 11C53 17 44 20 34 18" /><circle cx="42" cy="8" r="1.7" fill="var(--vv-primary)" stroke="none" /><path d="M60 11L72 12L62 17" fill="var(--vv-accent)" /><path d="M-4 22C-15 30-19 40-16 51C-6 45 1 37 7 28" />
        </g>
      </g>
    </svg>
  );
}

function LeafDivider() {
  return (
    <svg className="vv-divider" viewBox="0 0 300 40" fill="none" aria-hidden="true">
      <path d="M0 20H117M183 20H300" stroke="var(--vv-mid)" strokeWidth="1.5" />
      <path d="M150 35C146 25 145 15 150 5C155 15 154 25 150 35Z" fill="var(--vv-accent)" />
      <path d="M142 28C134 24 129 18 128 10C137 12 143 18 142 28ZM158 28C166 24 171 18 172 10C163 12 157 18 158 28Z" fill="var(--vv-mid)" />
    </svg>
  );
}

function ClosingFlourish() {
  return (
    <svg className="vv-closing-flourish" viewBox="0 0 440 180" fill="none" aria-hidden="true">
      <path d="M18 160C94 86 164 139 220 160C276 181 344 118 422 160" stroke="var(--vv-accent)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M144 151C127 126 115 105 111 77M115 105C95 102 80 91 72 75M123 123C143 116 158 101 165 82M296 151C312 126 325 105 329 77M325 105C345 102 360 91 368 75M317 123C297 116 282 101 275 82" stroke="var(--vv-border)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M111 77C100 89 99 105 105 116C118 106 121 91 111 77ZM72 75C86 77 96 88 99 102C86 100 76 91 72 75ZM165 82C150 84 139 97 136 111C150 108 160 97 165 82ZM329 77C340 89 341 105 335 116C322 106 319 91 329 77ZM368 75C354 77 344 88 341 102C354 100 364 91 368 75ZM275 82C290 84 301 97 304 111C290 108 280 97 275 82Z" fill="var(--vv-accent)" />
      <g fill="var(--vv-surface)"><circle cx="213" cy="129" r="2" /><circle cx="227" cy="129" r="2" /><path d="M220 112L223 120L231 123L223 126L220 134L217 126L209 123L217 120L220 112Z" /></g>
    </svg>
  );
}

const createVerdantVowsNavigationAdapter = () =>
  new VerdantVowsNavigationAdapter();

export default function VerdantVowsSource({
  invitationId,
  verifiedGuestName,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const railHideTimerRef = useRef<number | undefined>(undefined);
  const [opened, setOpened] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [railVisible, setRailVisible] = useState(true);
  const [visibleRailSections, setVisibleRailSections] = useState(
    () => new Set<(typeof rail)[number][0]>(rail.map(([id]) => id)),
  );
  const [activeSection, setActiveSection] =
    useState<(typeof rail)[number][0]>("hero");
  const [gallery, setGallery] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [wishName, setWishName] = useState(verifiedGuestName ?? "");
  const [wishMessage, setWishMessage] = useState("");
  const [wishAttendance, setWishAttendance] = useState<Attendance>("Hadir");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wishFeedback, setWishFeedback] = useState("");
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);
  const galleryTouchStartRef = useRef<number | null>(null);

  const revealRail = () => {
    setRailVisible(true);
    window.clearTimeout(railHideTimerRef.current);
    railHideTimerRef.current = window.setTimeout(() => setRailVisible(false), 3000);
  };

  const navigate = (sectionId: string) => {
    if (sectionId === "opening-envelope") {
      setOpened(false);
      rootRef.current?.scrollTo({ top: 0 });
      return;
    }
    setOpened(true);
    window.setTimeout(
      () =>
        rootRef.current
          ?.querySelector<HTMLElement>(`[data-template-section="${sectionId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      40,
    );
  };

  useEffect(() => {
    const onNavigate = (event: Event) =>
      navigate(
        (event as CustomEvent<{ sectionType: string }>).detail.sectionType,
      );
    const onGallery = (event: Event) =>
      setGallery((event as CustomEvent<{ urls: string[] }>).detail.urls);
    const onSectionVisibility = (event: Event) => {
      const enabled = (event as CustomEvent<{ enabled?: string[] }>).detail
        .enabled;
      if (!Array.isArray(enabled)) return;
      const next = new Set(
        enabled.filter((id): id is (typeof rail)[number][0] =>
          rail.some(([railId]) => railId === id),
        ),
      );
      setVisibleRailSections(next);
      setActiveSection((current) =>
        next.has(current) ? current : (rail.find(([id]) => next.has(id))?.[0] ?? "hero"),
      );
    };
    window.addEventListener("verdant-vows-navigate", onNavigate);
    window.addEventListener("verdant-vows-gallery", onGallery);
    window.addEventListener("verdant-vows-section-visibility", onSectionVisibility);
    return () => {
      window.removeEventListener("verdant-vows-navigate", onNavigate);
      window.removeEventListener("verdant-vows-gallery", onGallery);
      window.removeEventListener(
        "verdant-vows-section-visibility",
        onSectionVisibility,
      );
    };
  }, []);

  useEffect(() => {
    if (!invitationId) return;
    const controller = new AbortController();
    fetch(`/api/wishes?invitationId=${encodeURIComponent(invitationId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) =>
        response.ok ? response.json() : { wishes: [] },
      )
      .then((payload) => {
        if (controller.signal.aborted || !Array.isArray(payload.wishes)) return;
        setWishes(
          payload.wishes.filter(
            (wish: unknown): wish is Wish =>
              Boolean(wish) &&
              typeof (wish as Wish).id === "string" &&
              typeof (wish as Wish).name === "string" &&
              typeof (wish as Wish).message === "string" &&
              ["Hadir", "Belum pasti", "Berhalangan hadir"].includes(
                (wish as Wish).attendance,
              ),
          ),
        );
      })
      .catch(() => {});
    return () => controller.abort();
  }, [invitationId]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowRight")
        setLightboxIndex((index) =>
          index === null ? null : (index + 1) % gallery.length,
        );
      if (event.key === "ArrowLeft")
        setLightboxIndex((index) =>
          index === null ? null : (index - 1 + gallery.length) % gallery.length,
        );
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gallery.length, lightboxIndex]);

  useEffect(() => {
    if (lightboxIndex !== null && !gallery[lightboxIndex])
      setLightboxIndex(null);
  }, [gallery, lightboxIndex]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const syncRailVisibility = () => {
      const next = new Set<(typeof rail)[number][0]>();
      rail.forEach(([id]) => {
        const section = root.querySelector<HTMLElement>(
          `[data-template-section="${id}"]`,
        );
        if (
          section &&
          !section.hidden &&
          getComputedStyle(section).display !== "none"
        )
          next.add(id);
      });
      setVisibleRailSections(next);
      setActiveSection((current) =>
        next.has(current)
          ? current
          : (rail.find(([id]) => next.has(id))?.[0] ?? "hero"),
      );
    };
    syncRailVisibility();
    const observer = new MutationObserver(syncRailVisibility);
    observer.observe(root, {
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "style"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !opened) return;
    let frame = 0;
    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const marker =
          root.getBoundingClientRect().top + root.clientHeight * 0.43;
        let current: (typeof rail)[number][0] = "hero";
        rail.forEach(([id]) => {
          const section = root.querySelector<HTMLElement>(
            `[data-template-section="${id}"]`,
          );
          if (
            section &&
            !section.hidden &&
            getComputedStyle(section).display !== "none" &&
            section.getBoundingClientRect().top <= marker
          )
            current = id;
        });
        setActiveSection(current);
      });
    };
    updateActiveSection();
    root.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.cancelAnimationFrame(frame);
      root.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    const root = rootRef.current;
    revealRail();
    root?.addEventListener("scroll", revealRail, { passive: true });
    root?.addEventListener("pointerdown", revealRail, { passive: true });
    return () => {
      window.clearTimeout(railHideTimerRef.current);
      root?.removeEventListener("scroll", revealRail);
      root?.removeEventListener("pointerdown", revealRail);
    };
  }, [opened]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !opened) return;
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>("[data-template-section]"),
    );
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          entry.target.classList.toggle("vv-page-open", entry.isIntersecting);
        }),
      { root, rootMargin: "0px 0px -12%", threshold: 0.1 },
    );
    sections.forEach((section) => {
      if (section.dataset.templateSection === "hero")
        section.classList.add("vv-page-open");
      else observer.observe(section);
    });
    return () => observer.disconnect();
  }, [opened]);

  const openEnvelope = () => {
    setOpened(true);
    setActiveSection("hero");
    revealRail();
    const audio = audioRef.current;
    if (audio)
      audio
        .play()
        .then(() => setMusicOn(true))
        .catch(() => setMusicOn(false));
  };
  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused)
      audio
        .play()
        .then(() => setMusicOn(true))
        .catch(() => setMusicOn(false));
    else {
      audio.pause();
      setMusicOn(false);
    }
  };
  const copyAccount = (field = "account1") => {
    const account =
      document.querySelector<HTMLElement>(
        `[data-template-section='gift'] [data-field='${field}']`,
      )?.textContent ?? "";
    navigator.clipboard?.writeText(account).catch(() => {});
  };
  const saveToCalendar = () => {
    const event = rootRef.current?.querySelector<HTMLElement>(
      '[data-template-section="event"]',
    );
    const getField = (field: string) =>
      event
        ?.querySelector<HTMLElement>(`[data-field="${field}"]`)
        ?.textContent?.trim() ?? "";
    const monthIndex: Record<string, string> = {
      januari: "01",
      februari: "02",
      maret: "03",
      april: "04",
      mei: "05",
      juni: "06",
      juli: "07",
      agustus: "08",
      september: "09",
      oktober: "10",
      november: "11",
      desember: "12",
    };
    const dateMatch = getField("date")
      .toLowerCase()
      .match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
    if (!dateMatch || !monthIndex[dateMatch[2]]) return;
    const day = dateMatch[1].padStart(2, "0");
    const month = monthIndex[dateMatch[2]];
    const year = dateMatch[3];
    const time = getField("akadTime").match(/(\d{1,2})[.:](\d{2})/);
    const receptionTimes = Array.from(
      getField("receptionTime").matchAll(/(\d{1,2})[.:](\d{2})/g),
    );
    const endTime = receptionTimes.at(-1) ?? time;
    const start = `${year}${month}${day}T${(time?.[1] ?? "08").padStart(2, "0")}${time?.[2] ?? "00"}00`;
    const end = `${year}${month}${day}T${(endTime?.[1] ?? "14").padStart(2, "0")}${endTime?.[2] ?? "00"}00`;
    const escapeIcs = (value: string) =>
      value
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Undangan Studio//Verdant Vows//ID",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@undangan.studio`,
      `DTSTART;TZID=Asia/Jakarta:${start}`,
      `DTEND;TZID=Asia/Jakarta:${end}`,
      `SUMMARY:${escapeIcs(`Pernikahan ${document.querySelector<HTMLElement>('[data-template-section="hero"] [data-field="title"]')?.textContent?.trim() ?? ""}`)}`,
      `LOCATION:${escapeIcs(getField("venue"))}`,
      `DESCRIPTION:${escapeIcs(`${getField("address")}\\n${getField("akadTime")}\\n${getField("receptionTime")}`)}`,
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n");
    const file = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "undangan-raisa-arga.ics";
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const submitWish = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!wishName.trim() || !wishMessage.trim()) {
      setWishFeedback("Isi nama dan ucapan terlebih dahulu.");
      return;
    }
    if (isSubmittingWish) return;
    setIsSubmittingWish(true);
    setWishFeedback("");
    const nextWish: Wish = {
      id: crypto.randomUUID(),
      name: wishName.trim(),
      message: wishMessage.trim(),
      attendance: wishAttendance,
    };
    try {
      if (invitationId) {
        const response = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId,
            name: nextWish.name,
            message: nextWish.message,
            attendance: nextWish.attendance,
        }),
        });
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error || "Ucapan belum dapat dikirim.");
        if (payload.wish) setWishes((items) => [payload.wish as Wish, ...items]);
      } else {
        setWishes((items) => [nextWish, ...items]);
      }
      setWishMessage("");
      setWishFeedback("Terima kasih, konfirmasi Anda sudah tersimpan.");
    } catch (error) {
      setWishFeedback(
        error instanceof Error ? error.message : "Ucapan belum dapat dikirim.",
      );
    } finally {
      setIsSubmittingWish(false);
    }
  };

  return (
    <div className="verdant-shell" data-use-container="true">
      <TemplateNavigationRuntime
        createAdapter={createVerdantVowsNavigationAdapter}
      />
      <audio ref={audioRef} loop preload="metadata">
        <source src="/assets/audio/Banda-Neira-Sampai-Jadi-Debu.mp3" type="audio/mpeg" />
      </audio>
      <main
        ref={rootRef}
        className="verdant-scroll"
        data-template-scroll-root
        data-template-hydrated="true"
        data-opened={opened ? "true" : "false"}
        onPointerDown={revealRail}
      >
        <section className="vv-hero vv-section" data-template-section="hero">
          <BotanicalCorner className="vv-botanical vv-botanical--hero" />
          <VerdantDove className="vv-dove vv-dove--one" />
          <VerdantDove className="vv-dove vv-dove--two" />
          <div className="vv-hero-orbit" aria-hidden="true" />
          <p className="vv-kicker" data-field="eyebrow">
            Celebrate love, softly
          </p>
          <div className="vv-photo-frame">
            <img data-image alt="" />
            <span>Foto mempelai</span>
          </div>
          <div className="vv-hero-copy">
            <h1 data-field="title">Raisa &amp; Arga</h1>
            <p data-field="subtitle">14 November 2026 · Bandung</p>
          </div>
          <div className="vv-guest">
            <span data-field="guestLabel">Untuk Bapak/Ibu/Sahabat</span>
            <strong>{verifiedGuestName || "Tamu Undangan"}</strong>
          </div>
          <button
            type="button"
            className="vv-scroll-cue"
            onClick={() => navigate("couple")}
          >
            <span data-field="scrollLabel">Jelajahi undangan</span>
            <i>↓</i>
          </button>
        </section>

        <section
          className="vv-section vv-couple"
          data-template-section="couple"
        >
          <BotanicalCorner className="vv-botanical vv-botanical--couple" />
          <p className="vv-kicker" data-field="eyebrow">
            Mempelai
          </p>
          <h2 data-field="title">Perkenalkan mempelai</h2>
          <p className="vv-lead" data-field="intro">
            Dengan penuh rasa syukur, kami mengundang Anda untuk menjadi bagian
            dari awal perjalanan kami.
          </p>
          <div className="vv-couple-grid">
            <article className="vv-person-card">
              <div className="vv-portrait-frame">
                <img data-image data-image-slot="0" alt="" />
                <span>Foto The Bride</span>
              </div>
              <span>The Bride</span>
              <h3 data-field="brideName">Raisa Maharani</h3>
              <p data-field="brideParents">
                Putri dari Bapak Hendra &amp; Ibu Maya
              </p>
            </article>
            <article className="vv-person-card">
              <div className="vv-portrait-frame">
                <img data-image data-image-slot="1" alt="" />
                <span>Foto The Groom</span>
              </div>
              <span>The Groom</span>
              <h3 data-field="groomName">Arga Pratama</h3>
              <p data-field="groomParents">
                Putra dari Bapak Dimas &amp; Ibu Laras
              </p>
            </article>
          </div>
        </section>

        <section className="vv-section vv-event" data-template-section="event">
          <LeafDivider />
          <p className="vv-kicker" data-field="eyebrow">
            Save the date
          </p>
          <h2 data-field="title">Hari yang kami nantikan</h2>
          <div className="vv-date">
            <span data-field="day">Sabtu</span>
            <strong data-field="date">14 November 2026</strong>
          </div>
          <div className="vv-dress-code">
            <span className="vv-label" data-field="dressCodeLabel">
              Dress code
            </span>
            <strong data-field="dressCode">Sage, ivory &amp; champagne</strong>
            <p data-field="dressCodeNote">
              Kenakan nuansa lembut untuk merayakan hari kami bersama.
            </p>
          </div>
          <div className="vv-event-card">
            <div>
              <span className="vv-label">AKAD NIKAH</span>
              <p data-field="akadTime">08.00 WIB</p>
            </div>
            <div>
              <span className="vv-label">RESEPSI</span>
              <p data-field="receptionTime">11.00 – 14.00 WIB</p>
            </div>
          </div>
          <div className="vv-venue">
            <span className="vv-label">LOKASI</span>
            <h3 data-field="venue">Taman Hutan Raya</h3>
            <p data-field="address">Jl. Ir. H. Juanda No. 99, Dago, Bandung</p>
            <div className="vv-event-actions">
              <a
                data-map-link
                href="https://www.google.com/maps"
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
                  <circle cx="12" cy="10" r="2" />
                </svg>
                <span data-field="buttonLabel">Buka Google Maps</span>
              </a>
              <button
                type="button"
                className="vv-calendar"
                onClick={saveToCalendar}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                  <path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6" />
                </svg>
                <span data-field="calendarLabel">Simpan ke kalender</span>
              </button>
            </div>
          </div>
        </section>

        <section className="vv-section vv-story" data-template-section="story">
          <BotanicalCorner className="vv-botanical vv-botanical--story" />
          <p className="vv-kicker" data-field="eyebrow">
            Dari perkenalan hingga selamanya
          </p>
          <h2 data-field="title">Perjalanan kami</h2>
          <p className="vv-lead" data-field="intro">
            Sebuah perjalanan sederhana yang akhirnya membawa kami pada hari
            istimewa ini.
          </p>
          <div className="vv-timeline">
            <article className="vv-timeline-item">
              <time data-field="firstDate">2020</time>
              <div>
                <h3 data-field="firstTitle">Berkenalan</h3>
                <p data-field="firstCopy">
                  Dari sebuah percakapan kecil, kami menemukan kenyamanan yang
                  terasa begitu akrab.
                </p>
              </div>
            </article>
            <article className="vv-timeline-item">
              <time data-field="secondDate">2023</time>
              <div>
                <h3 data-field="secondTitle">Menumbuhkan keyakinan</h3>
                <p data-field="secondCopy">
                  Kami belajar saling berjalan, mendengar, dan merayakan banyak
                  hal sederhana bersama.
                </p>
              </div>
            </article>
            <article className="vv-timeline-item">
              <time data-field="thirdDate">2026</time>
              <div>
                <h3 data-field="thirdTitle">Menuju selamanya</h3>
                <p data-field="thirdCopy">
                  Dengan doa keluarga, kami memilih untuk melangkah ke jenjang
                  pernikahan.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section
          className="vv-section vv-gallery"
          data-template-section="gallery"
        >
          <p className="vv-kicker" data-field="eyebrow">
            Little chapters
          </p>
          <h2 data-field="title">Momen yang tumbuh bersama</h2>
          <p className="vv-lead" data-field="subtitle">
            Sepotong cerita yang membawa kami sampai ke hari ini.
          </p>
          <div className="vv-gallery-grid" data-gallery>
            {Array.from({ length: 4 }, (_, index) => {
              const url = gallery[index];
              return (
                <figure className="vv-gallery-frame" key={url ? `${url}-${index}` : `frame-${index}`}>
                  {url ? (
                    <button
                      type="button"
                      className="vv-gallery-open"
                      onClick={() => setLightboxIndex(index)}
                      aria-label={`Buka foto ${index + 1}`}
                    >
                      <img src={url} alt={`Momen ${index + 1}`} />
                    </button>
                  ) : (
                    <span>Foto pilihan</span>
                  )}
                </figure>
              );
            })}
          </div>
        </section>

        <section className="vv-section vv-gift" data-template-section="gift">
          <BotanicalCorner className="vv-botanical vv-botanical--gift" />
          <p className="vv-kicker" data-field="eyebrow">
            With gratitude
          </p>
          <h2 data-field="title">Tanda kasih</h2>
          <p className="vv-lead" data-field="subtitle">
            Kehadiran dan doa Anda adalah hadiah terbaik.
          </p>
          <div className="vv-gift-content">
            <div className="vv-bank-stack" data-gift-bank-area>
              <article className="vv-bank">
                <span data-field="bank1">BCA</span>
                <strong data-field="account1">123 456 7890</strong>
                <p data-field="holder1">a.n. Raisa Maharani</p>
                <button
                  type="button"
                  onClick={() => copyAccount()}
                  data-field="buttonLabel"
                >
                  Salin nomor
                </button>
              </article>
              <article
                className="vv-bank vv-bank--secondary"
                data-gift-second-account
                hidden
              >
                <span data-field="bank2">DANA</span>
                <strong data-field="account2">0812 3456 7890</strong>
                <p data-field="holder2">a.n. Arga Pratama</p>
                <button
                  type="button"
                  onClick={() => copyAccount("account2")}
                  data-field="buttonLabel"
                >
                  Salin nomor
                </button>
              </article>
            </div>
            <div className="vv-qris" data-gift-qris-area>
              <div className="vv-qris-box">
                <img data-gift-qris hidden alt="" />
                <div className="vv-qris-placeholder" data-gift-qris-placeholder>
                  <span>▦</span>
                  <small>QRIS</small>
                </div>
              </div>
              <span data-field="qrisLabel">Scan QRIS tanda kasih</span>
            </div>
          </div>
        </section>

        <section
          className="vv-section vv-wishes"
          data-template-section="wishes"
        >
          <p className="vv-kicker" data-field="eyebrow">
            For the newlyweds
          </p>
          <h2 data-field="title">Titipkan doa baik</h2>
          <p className="vv-lead" data-field="subtitle">
            Kata-kata Anda akan menjadi kenangan yang selalu kami simpan.
          </p>
          <form onSubmit={submitWish} className="vv-wish-form">
            <input
              value={wishName}
              onChange={(e) => setWishName(e.target.value)}
              placeholder="Nama Anda"
              data-placeholder-field="namePlaceholder"
            />
            <textarea
              value={wishMessage}
              onChange={(e) => setWishMessage(e.target.value)}
              placeholder="Tulis ucapan dan doa"
              data-placeholder-field="messagePlaceholder"
            />
            <fieldset className="vv-rsvp" aria-label="Konfirmasi kehadiran">
              <legend data-field="attendanceLabel">Konfirmasi kehadiran</legend>
              <div>
                {(
                  [
                    ["Hadir", "attendancePresentLabel"],
                    ["Belum pasti", "attendanceUnsureLabel"],
                    ["Berhalangan hadir", "attendanceAbsentLabel"],
                  ] as const
                ).map(([attendance, labelField]) => (
                  <button
                    key={attendance}
                    type="button"
                    aria-pressed={wishAttendance === attendance}
                    className={
                      wishAttendance === attendance ? "is-selected" : undefined
                    }
                    onClick={() => setWishAttendance(attendance)}
                    data-field={labelField}
                  >
                    {attendance}
                  </button>
                ))}
              </div>
            </fieldset>
            <button type="submit" disabled={isSubmittingWish} data-field="submitLabel">
              {isSubmittingWish ? "Mengirim…" : "Kirim ucapan"}
            </button>
            {wishFeedback && (
              <p className="vv-wish-feedback" role="status">{wishFeedback}</p>
            )}
          </form>
          {wishes.map((wish) => (
            <article className="vv-wish" key={wish.id}>
              <strong>{wish.name} <small>{wish.attendance}</small></strong>
              <p>{wish.message}</p>
            </article>
          ))}
        </section>

        <section
          className="vv-section vv-closing"
          data-template-section="closing"
        >
          <div className="vv-closing-orbit" />
          <img
            className="vv-closing-dove"
            src="/assets/wedding/merpati.png"
            alt=""
            aria-hidden="true"
          />
          <h2 data-field="title">Terima kasih</h2>
          <p data-field="copy">
            Terima kasih telah meluangkan waktu, doa, dan kehangatan untuk
            merayakan awal kisah kami.
          </p>
          <strong data-field="subtitle">Raisa &amp; Arga</strong>
          <VerdantDove className="vv-closing-flight vv-closing-flight--one" />
          <VerdantDove className="vv-closing-flight vv-closing-flight--two" />
          <ClosingFlourish />
        </section>
      </main>

      {lightboxIndex !== null && gallery[lightboxIndex] && (
        <div
          className="vv-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ${lightboxIndex + 1} dari ${gallery.length}`}
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="vv-lightbox-content"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => {
              galleryTouchStartRef.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const start = galleryTouchStartRef.current;
              const end = event.changedTouches[0]?.clientX;
              galleryTouchStartRef.current = null;
              if (start === null || end === undefined || Math.abs(start - end) < 42)
                return;
              setLightboxIndex((index) =>
                index === null
                  ? null
                  : start > end
                    ? (index + 1) % gallery.length
                    : (index - 1 + gallery.length) % gallery.length,
              );
            }}
          >
            <img src={gallery[lightboxIndex]} alt={`Momen ${lightboxIndex + 1}`} />
            <span>{lightboxIndex + 1} / {gallery.length}</span>
            <button type="button" className="vv-lightbox-close" onClick={() => setLightboxIndex(null)} aria-label="Tutup galeri">×</button>
            {gallery.length > 1 && <>
              <button type="button" className="vv-lightbox-prev" onClick={() => setLightboxIndex((index) => index === null ? null : (index - 1 + gallery.length) % gallery.length)} aria-label="Foto sebelumnya">‹</button>
              <button type="button" className="vv-lightbox-next" onClick={() => setLightboxIndex((index) => index === null ? null : (index + 1) % gallery.length)} aria-label="Foto berikutnya">›</button>
            </>}
          </div>
        </div>
      )}

      <aside className={`verdant-rail ${railVisible ? "" : "is-hidden"}`} aria-label="Navigasi undangan" aria-hidden={!railVisible}>
        {rail.filter(([id]) => visibleRailSections.has(id)).map(([id, label, icon]) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              className={isActive ? "is-active" : undefined}
              aria-current={isActive ? "location" : undefined}
              tabIndex={railVisible ? 0 : -1}
              onFocus={revealRail}
              onClick={() => {
                revealRail();
                setActiveSection(id);
                navigate(id);
              }}
              title={label}
            >
              <span>{icon}</span>
              <em>{label}</em>
            </button>
          );
        })}
      </aside>
      <button
        type="button"
        className={`vv-audio ${musicOn ? "is-on" : ""}`}
        onClick={toggleMusic}
        aria-label="Putar atau jeda musik"
      >
        {musicOn ? "♫" : "♪"}
      </button>
      {!opened && (
        <section
          className="vv-envelope"
          data-template-section="opening-envelope"
        >
          <BotanicalCorner className="vv-envelope-botanical" />
          <div className="vv-envelope-card">
            <p data-field="eyebrow">The Wedding Of</p>
            <h1 data-field="title">Raisa &amp; Arga</h1>
            <span data-field="date">Sabtu, 14 November 2026</span>
            <div className="vv-envelope-line" />
            <small data-field="guestLabel">Kepada Yth.</small>
            <strong>{verifiedGuestName || "Bapak/Ibu/Sahabat"}</strong>
            <button type="button" onClick={openEnvelope} data-field="sealLabel">
              Buka Undangan
            </button>
            <i data-field="footer">
              Dengan penuh sukacita, kami mengundang Anda.
            </i>
          </div>
        </section>
      )}
    </div>
  );
}
