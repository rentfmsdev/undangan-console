"use client";

import "./wedding-original.css";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Gift,
  Heart,
  Images,
  MapPin,
  MessageCircleHeart,
  Feather,
  LoaderCircle,
  Send,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { WeddingField } from "./components/ui/wedding-field";
import { OpeningEnvelope, type OpeningStage } from "./components/opening-envelope";
import { TemplateNavigationRuntime } from "@/templates/navigation/TemplateNavigationRuntime";
import { WeddingLampungNavigationAdapter } from "../navigation-adapter";
import { wedding } from "./wedding-data";
import { WEDDING_GALLERY_UPDATE_EVENT } from "./template-bridge";

type Attendance = "Hadir" | "Belum pasti" | "Berhalangan hadir";
type StoredWish = { id: string; name: string; attendance: Attendance; message: string; createdAt: string };

type Countdown = { days: number; hours: number; minutes: number; seconds: number };

const emptyCountdown: Countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };

function formatGuestName(value: string) {
  return value
    .toLocaleLowerCase("id-ID")
    .replace(/(^|[\s/'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase("id-ID"));
}

function getCountdown(): Countdown {
  const configuredTarget = typeof document === "undefined" ? "" : document.documentElement.dataset.weddingTargetDate;
  const gap = Math.max(0, new Date(configuredTarget || wedding.dateISO).getTime() - Date.now());
  return {
    days: Math.floor(gap / 86_400_000),
    hours: Math.floor((gap / 3_600_000) % 24),
    minutes: Math.floor((gap / 60_000) % 60),
    seconds: Math.floor((gap / 1_000) % 60),
  };
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="section-heading reveal">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <div className="heading-ornament" aria-hidden="true">
        <i /> <Heart size={13} fill="currentColor" /> <i />
      </div>
    </div>
  );
}

function Hero({ guestName }: { guestName: string }) {
  return (
    <section className="hero" id="home" data-template-section="hero">
      <Image className="hero-photo" src={wedding.photos[0]} alt="Ayu dan Ardi dalam busana adat Lampung" fill priority sizes="(max-width: 720px) 100vw, 620px" />
      <div className="hero-shade" />
      <div className="hero-frame" />
      <div className="hero-monogram" aria-hidden="true"><span>A</span><i>&</i><span>A</span></div>
      <div className="hero-content">
        <p className="hero-kicker">The Wedding of</p>
        <h1>Ayu <span>&</span> Ardi</h1>
        <p className="hero-date">Sabtu · 26 September · 2026</p>
        <div className="hero-dove-pair" aria-hidden="true">
          <Image className="content-dove content-dove-left" src="/assets/dove.svg" alt="" width={180} height={104} />
          <span>♡</span>
          <Image className="content-dove content-dove-right" src="/assets/dove.svg" alt="" width={180} height={104} />
        </div>
        <div className="hero-guest">
          <small>Kepada Yth.</small>
          <strong>{guestName}</strong>
        </div>
        <a className="scroll-cue" href="#welcome" aria-label="Gulir ke bawah">
          <span>Scroll</span><ChevronDown size={18} />
        </a>
      </div>
    </section>
  );
}

function Welcome() {
  return (
    <section className="welcome paper-section" id="welcome" data-template-section="couple">
      <Image className="corner-flower corner-top" src="/assets/flower-green.svg" alt="" width={330} height={312} />
      <div className="bismillah reveal">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيْم</div>
      <p className="greeting reveal">Assalamu’alaikum Warahmatullahi Wabarakatuh</p>
      <p className="intro-copy reveal">
        Dengan memohon rahmat dan rida Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami.
      </p>

      <div className="heritage-pair">
        <figure className="welcome-portrait welcome-portrait-lampung reveal">
          <Image src={wedding.welcomePortrait} alt="Ayu dan Ardi dalam busana adat Lampung" fill sizes="(max-width: 620px) 82vw, 430px" />
        </figure>
        <div className="couple-block reveal">
          <p className="script-label">The Bride</p>
          <h2>{wedding.bride.fullName}</h2>
          <p>{wedding.bride.order} dari</p>
          <strong>{wedding.bride.parents}</strong>
        </div>

        <div className="couple-ampersand reveal">&</div>

        <div className="couple-block reveal">
          <p className="script-label">The Groom</p>
          <h2>{wedding.groom.fullName}</h2>
          <p>{wedding.groom.order} dari</p>
          <strong>{wedding.groom.parents}</strong>
        </div>
      </div>
      <Image className="corner-flower corner-bottom" src="/assets/flower-green.svg" alt="" width={330} height={312} />
    </section>
  );
}

function CountdownSection({ countdown }: { countdown: Countdown }) {
  const values = [
    [countdown.days, "Hari"],
    [countdown.hours, "Jam"],
    [countdown.minutes, "Menit"],
    [countdown.seconds, "Detik"],
  ];

  return (
    <section className="countdown-section" data-template-section="countdown">
      <div className="countdown-image" aria-hidden="true" />
      <div className="countdown-overlay" />
      <div className="countdown-content reveal">
        <p>Save the Date</p>
        <h2>Menuju Hari Bahagia</h2>
        <div className="countdown-grid">
          {values.map(([value, label]) => (
            <div className="countdown-item" key={label}>
              <strong>{String(value).padStart(2, "0")}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <a
          className="light-button"
          href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=The%20Wedding%20of%20Ayu%20%26%20Ardi&dates=20260926T010000Z/20260926T070000Z&details=Undangan%20Pernikahan%20Ayu%20dan%20Ardi&location=Dusun%20Srimenanti%2C%20Negeri%20Sakti%2C%20Pesawaran%2C%20Lampung"
          target="_blank"
          rel="noreferrer"
        >
          <CalendarDays size={17} /> Simpan Tanggal
        </a>
      </div>
    </section>
  );
}

function EventSection() {
  return (
    <section className="event-section paper-section" id="event" data-template-section="event">
      <SectionHeading eyebrow="Rangkaian Acara" title="Hari Bahagia Kami" />
      <p className="event-invite reveal">Insya Allah akan dilaksanakan pada:</p>
      <div className="date-ribbon reveal">
        <span>Sabtu</span><strong>26</strong><span>September 2026</span>
      </div>

      <div className="event-cards">
        <article className="event-card reveal">
          <div className="event-icon"><Heart size={21} /></div>
          <p>Akad Nikah</p>
          <h3>{wedding.akad}</h3>
          <span><Clock3 size={15} /> Pagi hari</span>
        </article>
        <article className="event-card reveal">
          <div className="event-icon"><Gift size={21} /></div>
          <p>Resepsi</p>
          <h3>{wedding.reception}</h3>
          <span><Clock3 size={15} /> Sampai selesai</span>
        </article>
      </div>

      <div className="location-card reveal" data-template-section="map">
        <MapPin size={24} />
        <small>Lokasi Akad & Resepsi</small>
        <p>{wedding.address}</p>
        <a href={wedding.mapUrl} target="_blank" rel="noreferrer">Buka Google Maps</a>
      </div>

      <div className="event-pattern-divider reveal" aria-hidden="true">
        <Image src="/assets/divider-tapis.svg" alt="" width={520} height={64} />
      </div>

      <article className="unduh-card reveal" data-template-section="unduh-mantu">
        <div className="event-icon"><Sparkles size={21} /></div>
        <div className="unduh-content">
          <small>Acara Keluarga Mempelai Pria</small>
          <p>Unduh Mantu</p>
          <h3>{wedding.unduhMantu.displayDate}</h3>
          <div className="unduh-address">
            <MapPin size={18} />
            <span>{wedding.unduhMantu.address}</span>
          </div>
          <a href={wedding.unduhMantu.mapUrl} target="_blank" rel="noreferrer">Buka Google Maps</a>
        </div>
      </article>
    </section>
  );
}

function QuoteSection() {
  return (
    <section className="quote-section" data-template-section="quote">
      <Image src={wedding.photos[3]} alt="Ayu dan Ardi dalam busana adat Jawa" fill sizes="(max-width: 720px) 100vw, 620px" />
      <div className="quote-overlay" />
      <blockquote className="reveal">
        <span>“</span>
        Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram di sampingnya.
        <cite>QS. Ar-Rum: 21</cite>
      </blockquote>
    </section>
  );
}

function GallerySection() {
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(wedding.galleryPhotos);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const activePhoto = activePhotoIndex === null ? null : galleryPhotos[activePhotoIndex];

  useEffect(() => {
    const updateGallery = (event: Event) => {
      const photos = (event as CustomEvent<{ photos?: unknown }>).detail?.photos;
      if (!Array.isArray(photos)) return;
      const nextPhotos = photos.filter((photo): photo is string => typeof photo === "string" && Boolean(photo));
      setGalleryPhotos((current) => current.length === nextPhotos.length && current.every((photo, index) => photo === nextPhotos[index]) ? current : nextPhotos);
      setActivePhotoIndex((current) => current !== null && current >= nextPhotos.length ? null : current);
    };
    window.addEventListener(WEDDING_GALLERY_UPDATE_EVENT, updateGallery);
    return () => window.removeEventListener(WEDDING_GALLERY_UPDATE_EVENT, updateGallery);
  }, []);

  const closeLightbox = () => setActivePhotoIndex(null);
  const movePhoto = (direction: number) => {
    setActivePhotoIndex((current) => {
      if (current === null) return 0;
      if (!galleryPhotos.length) return null;
      return (current + direction + galleryPhotos.length) % galleryPhotos.length;
    });
  };

  useEffect(() => {
    if (activePhotoIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePhotoIndex(null);
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const direction = event.key === "ArrowLeft" ? -1 : 1;
        setActivePhotoIndex((current) => current === null || !galleryPhotos.length ? null : (current + direction + galleryPhotos.length) % galleryPhotos.length);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activePhotoIndex, galleryPhotos.length]);

  return (
    <>
      <section className="gallery-section paper-section" id="gallery" data-template-section="gallery">
        <SectionHeading eyebrow="Our Moments" title="Galeri Bahagia" />
        <div className={`gallery-grid gallery-count-${Math.min(galleryPhotos.length, 4)}`}>
          {galleryPhotos.map((photo, index) => (
            <button
              className={`gallery-item gallery-item-${index + 1} reveal`}
              key={`${photo}-${index}`}
              type="button"
              onClick={() => setActivePhotoIndex(index)}
              aria-label={`Lihat foto prewedding Ayu dan Ardi ${index + 1}`}
            >
              <Image src={photo} alt={`Foto prewedding Ayu dan Ardi ${index + 1}`} fill sizes="(max-width: 720px) 50vw, 300px" />
              <span>0{index + 1}</span>
              <em>lihat foto</em>
            </button>
          ))}
          {!galleryPhotos.length && <p className="gallery-empty">Belum ada foto galeri</p>}
        </div>
        <p className="gallery-signature reveal">Two cultures, one beautiful story.</p>
      </section>

      {activePhoto && activePhotoIndex !== null && (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={`Preview foto ${activePhotoIndex + 1}`} onMouseDown={(event) => { if (event.target === event.currentTarget) closeLightbox(); }}>
          <div className="gallery-lightbox-glow" aria-hidden="true" />
          <div className="gallery-lightbox-panel">
            <button className="lightbox-close" type="button" onClick={closeLightbox} aria-label="Tutup preview foto"><X size={20} /></button>
            <button className="lightbox-nav lightbox-prev" type="button" onClick={() => movePhoto(-1)} aria-label="Foto sebelumnya"><ChevronLeft size={25} /></button>
            <div className="lightbox-photo-frame">
              <Image src={activePhoto} alt={`Preview foto prewedding Ayu dan Ardi ${activePhotoIndex + 1}`} fill sizes="(max-width: 720px) 94vw, 620px" priority />
            </div>
            <button className="lightbox-nav lightbox-next" type="button" onClick={() => movePhoto(1)} aria-label="Foto berikutnya"><ChevronRight size={25} /></button>
            <div className="lightbox-caption"><span>Ayu <i>&</i> Ardi</span><b>{String(activePhotoIndex + 1).padStart(2, "0")} <i>/</i> {String(galleryPhotos.length).padStart(2, "0")}</b></div>
          </div>
        </div>
      )}
    </>
  );
}

function GiftSection() {
  const [copied, setCopied] = useState<number | null>(null);

  const copyAccount = async (number: string, index: number) => {
    try {
      await navigator.clipboard.writeText(number.replaceAll(" ", ""));
      setCopied(index);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section className="gift-section" id="gift" data-template-section="gift">
      <div className="gift-inner">
        <SectionHeading eyebrow="Tanda Kasih" title="Wedding Gift" />
        <p className="gift-copy reveal">
          Doa restu Anda merupakan hadiah terindah bagi kami. Namun bila ingin memberikan tanda kasih, dapat melalui rekening berikut.
        </p>
        <div className="bank-list">
          {wedding.giftAccounts.map((account, index) => (
            <article className="bank-card reveal" key={account.bank}>
              <div className="bank-top"><span>{account.bank}</span><i>♡</i></div>
              <strong>{account.number}</strong>
              <p>{account.holder}</p>
              <button onClick={() => copyAccount(account.number, index)}>
                {copied === index ? <Check size={15} /> : <Copy size={15} />}
                {copied === index ? "Tersalin" : "Salin nomor"}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WishesSection({ invitationId }: { invitationId?: string }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [attendance, setAttendance] = useState<Attendance>("Hadir");
  const [wishes, setWishes] = useState<StoredWish[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const [loadingWishes, setLoadingWishes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadWishes = async () => {
      try {
        const endpoint = invitationId ? `/api/wishes?invitationId=${encodeURIComponent(invitationId)}` : "/api/wishes";
        const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        const data = await response.json() as { wishes?: StoredWish[] };
        if (response.ok && data.wishes) setWishes(data.wishes.slice(0, 12));
      } catch {
        // Form tetap dapat digunakan jika daftar awal belum berhasil dimuat.
      } finally {
        if (!controller.signal.aborted) setLoadingWishes(false);
      }
    };

    void loadWishes();
    return () => controller.abort();
  }, [invitationId]);

  const submitWish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !message.trim() || submitting) return;

    setSubmitting(true);
    setFormMessage("");
    try {
      const endpoint = invitationId ? `/api/wishes?invitationId=${encodeURIComponent(invitationId)}` : "/api/wishes";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim(), attendance }),
      });
      const data = await response.json() as { wish?: StoredWish; message?: string };
      if (!response.ok || !data.wish) throw new Error(data.message ?? "Ucapan gagal disimpan.");

      setWishes((current) => [data.wish as StoredWish, ...current].slice(0, 12));
      setName("");
      setMessage("");
      setFormMessage("Ucapan berhasil tersimpan.");
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), 2600);
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Ucapan gagal disimpan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="wishes-section paper-section" id="wishes" data-template-section="wishes">
      {celebrating && (
        <div className="celebration" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => <i key={index}>♥</i>)}
          <strong>Terima kasih atas doanya!</strong>
        </div>
      )}
      <SectionHeading eyebrow="Kirim Doa" title="Ucapan & Kehadiran" />
      <form className="wish-form reveal" onSubmit={submitWish}>
        <div className="wish-form-heading">
          <span><Feather size={15} /></span>
          <div><strong>Tinggalkan Pesan</strong><small>Setiap doa adalah hadiah terindah bagi kami</small></div>
        </div>

        <WeddingField htmlFor="wish-name" icon={<UserRound size={15} />} label="Nama Anda">
          <input id="wish-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tulis nama lengkap" maxLength={45} autoComplete="name" required />
        </WeddingField>

        <WeddingField icon={<UsersRound size={15} />} label="Konfirmasi Kehadiran">
          <div className="attendance-options" role="radiogroup" aria-label="Konfirmasi kehadiran">
            {(["Hadir", "Belum pasti", "Berhalangan hadir"] as Attendance[]).map((option) => (
              <label className={attendance === option ? "is-selected" : ""} key={option}>
                <input type="radio" name="attendance" value={option} checked={attendance === option} onChange={() => setAttendance(option)} />
                <i aria-hidden="true" />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </WeddingField>

        <WeddingField htmlFor="wish-message" icon={<MessageCircleHeart size={15} />} label="Ucapan & Doa" wide>
          <textarea id="wish-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tuliskan doa terbaik untuk kedua mempelai…" maxLength={240} required />
          <small className="character-count">{message.length}/240</small>
        </WeddingField>

        {formMessage && <p className="wish-form-message" data-wish-state={formMessage === "Ucapan berhasil tersimpan." ? "success" : "error"} role="status">{formMessage}</p>}
        <button className="wish-submit" type="submit" disabled={submitting}>
          {submitting ? <LoaderCircle className="submit-spinner" size={16} /> : <Send size={16} />}
          {submitting ? "Menyimpan…" : "Kirim Ucapan"}
        </button>
      </form>

      <div className="wish-list" aria-live="polite">
        {loadingWishes ? (
          <p className="empty-wishes reveal" data-wish-state="loading">Memuat ucapan…</p>
        ) : wishes.length === 0 ? (
          <p className="empty-wishes reveal" data-wish-state="empty">Jadilah yang pertama mengirimkan doa terbaik.</p>
        ) : wishes.map((wish, index) => (
          <article className="wish-bubble" key={wish.id || `${wish.name}-${index}`}>
            <div><strong>{wish.name}</strong><span>{wish.attendance}</span></div>
            <p>{wish.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <footer className="closing-section" data-template-section="closing">
      <div className="falling-petals" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
      </div>
      <Image src={wedding.photos[0]} alt="Ayu dan Ardi" fill sizes="(max-width: 720px) 100vw, 620px" />
      <div className="closing-overlay" />
      <div className="closing-content reveal">
        <p>Terima Kasih</p>
        <span>Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.</span>
        <h2>Ayu <i>&</i> Ardi</h2>
        <small>Wassalamu’alaikum Warahmatullahi Wabarakatuh</small>
        <b>26 · 09 · 2026</b>
      </div>
    </footer>
  );
}

const floatingNavLinks = [
  ["#home", Heart, "Awal"],
  ["#event", CalendarDays, "Acara"],
  ["#gallery", Images, "Galeri"],
  ["#gift", Gift, "Hadiah"],
  ["#wishes", MessageCircleHeart, "Ucapan"],
] as const;

const floatingNavSectionTypes: Record<string, string> = {
  home: "hero",
  event: "event",
  gallery: "gallery",
  gift: "gift",
  wishes: "wishes",
};

function FloatingNav() {
  const [activeSection, setActiveSection] = useState("home");

  const getScrollRoot = () => document.querySelector<HTMLElement>("[data-template-scroll-root]");

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const root = getScrollRoot();
        if (!root) return;
        const marker = root.getBoundingClientRect().top + root.clientHeight * 0.42;
        let current = "home";

        floatingNavLinks.forEach(([href]) => {
          const id = href.slice(1);
          const section = document.getElementById(id);
          if (section && section.getBoundingClientRect().top <= marker) current = id;
        });

        setActiveSection(current);
      });
    };

    updateActiveSection();
    const root = getScrollRoot();
    root?.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.cancelAnimationFrame(frame);
      root?.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  return (
    <nav className="floating-nav" aria-label="Navigasi undangan">
      {floatingNavLinks.map(([href, Icon, label]) => {
        const id = href.slice(1);
        const isActive = activeSection === id;

        return (
          <button
            type="button"
            key={href}
            className={isActive ? "is-active" : undefined}
            aria-current={isActive ? "location" : undefined}
            onClick={(event) => {
              event.preventDefault();
              event.currentTarget.blur();
              setActiveSection(id);
              window.dispatchEvent(new CustomEvent("template:navigate", { detail: { sectionId: floatingNavSectionTypes[id] ?? id, source: "preview-navbar" } }));
            }}
          >
            <span className="nav-dove-indicator" aria-hidden="true">
              <Image src="/assets/dove.svg" alt="" width={180} height={104} />
            </span>
            <Icon className="nav-icon" size={18} />
            <span className="nav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function WeddingInvitation({
  invitationId,
  verifiedGuestName,
}: {
  invitationId?: string;
  verifiedGuestName?: string;
}) {
  const searchParams = useSearchParams();
  const requestedGuest = searchParams.get("for")?.trim();
  const guestName = verifiedGuestName
    ? formatGuestName(verifiedGuestName)
    : invitationId
    ? "Bapak/Ibu/Saudara/i"
    : requestedGuest
    ? formatGuestName(requestedGuest.slice(0, 70))
    : "Bapak/Ibu/Saudara/i";
  const [stage, setStage] = useState<OpeningStage>("sealed");
  const [countdown, setCountdown] = useState<Countdown>(emptyCountdown);
  const musicRef = useRef<HTMLAudioElement>(null);
  const opened = stage === "opened";

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-template-scroll-root]");
    if (root) root.dataset.templateHydrated = "true";
    return () => {
      if (root) delete root.dataset.templateHydrated;
    };
  }, []);

  useEffect(() => {
    const handleCustomNavigate = (event: Event) => {
      const customEvent = event as CustomEvent<{ sectionType: string }>;
      const type = customEvent.detail?.sectionType;
      if (!type) return;
      if (type === "opening-envelope") {
        setStage("sealed");
        return;
      }
      setStage("opened");
    };

    window.addEventListener("wedding-preview-navigate", handleCustomNavigate);
    return () => window.removeEventListener("wedding-preview-navigate", handleCustomNavigate);
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setCountdown(getCountdown()), 0);
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!opened) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.13 }
    );
    const observeRevealElements = (root: ParentNode) => {
      if (root instanceof HTMLElement && root.matches(".reveal")) observer.observe(root);
      root.querySelectorAll<HTMLElement>(".reveal").forEach((element) => observer.observe(element));
    };
    const invitationPage = document.querySelector<HTMLElement>(".invitation-page");
    if (invitationPage) observeRevealElements(invitationPage);
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) observeRevealElements(node);
      }));
    });
    if (invitationPage) mutationObserver.observe(invitationPage, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [opened]);

  const openInvitation = () => {
    if (stage !== "sealed") return;
    const music = musicRef.current;
    const source = music?.querySelector<HTMLSourceElement>("source");
    const hasValidSource = Boolean(source && source.getAttribute("src"));
    if (music && hasValidSource) {
      music.currentTime = 0;
      music.muted = true;
      const customVol = typeof window !== "undefined" && typeof (window as unknown as { __weddingMusicVolume?: number }).__weddingMusicVolume === "number" ? (window as unknown as { __weddingMusicVolume?: number }).__weddingMusicVolume! : 0.60;
      music.volume = customVol;
      void music.play().catch(() => {
        // Browser dapat memblokir audio pada mode hemat data atau pengaturan khusus pengguna.
      });
    }
    setStage("flap");
    window.setTimeout(() => setStage("letter"), 950);
    window.setTimeout(() => setStage("hold"), 2550);
    window.setTimeout(() => setStage("leaving"), 3650);
    window.setTimeout(() => {
      const delayedMusic = musicRef.current;
      const delayedSource = delayedMusic?.querySelector<HTMLSourceElement>("source");
      const canPlay = Boolean(delayedSource && delayedSource.getAttribute("src"));
      if (delayedMusic && canPlay) {
        delayedMusic.currentTime = 0;
        delayedMusic.muted = false;
        void delayedMusic.play().catch(() => {});
      }
      setStage("opened");
      const scrollRoot = document.querySelector<HTMLElement>("[data-template-scroll-root]");
      if (scrollRoot) scrollRoot.scrollTop = 0;
    }, 4350);
  };

  const mainClass = useMemo(() => `invitation-shell ${opened ? "is-open" : ""}`, [opened]);

  return (
    <main className={mainClass}>
      <TemplateNavigationRuntime createAdapter={createWeddingNavigationAdapter} />
      <audio ref={musicRef} loop preload="auto" playsInline>
        <source src="/assets/audio/easy-on-me.webm" type="audio/webm" />
      </audio>
      {!opened && <OpeningEnvelope guestName={guestName} onOpen={openInvitation} stage={stage} />}
      <div className="wedding-scroll-root" data-template-scroll-root data-opened={opened ? "true" : "false"}>
        <div className="invitation-page" aria-hidden={!opened}>
          <Hero guestName={guestName} />
          <Welcome />
          <CountdownSection countdown={countdown} />
          <EventSection />
          <QuoteSection />
          <GallerySection />
          <GiftSection />
          <WishesSection invitationId={invitationId} />
          <ClosingSection />
        </div>
      </div>
      {opened && <FloatingNav />}
    </main>
  );
}

export default function WeddingPage({ invitationId, verifiedGuestName }: { invitationId?: string; verifiedGuestName?: string }) {
  return (
    <Suspense fallback={<div className="loading-screen">Mempersiapkan undangan…</div>}>
      <WeddingInvitation invitationId={invitationId} verifiedGuestName={verifiedGuestName} />
    </Suspense>
  );
}

function createWeddingNavigationAdapter() {
  return new WeddingLampungNavigationAdapter();
}
