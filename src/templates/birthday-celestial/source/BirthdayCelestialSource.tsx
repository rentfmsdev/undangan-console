"use client";

import "./birthday.css";
import "./birthday-overrides.css";
import "./birthday-closing-balloons.css";
import "./birthday-hero-balloons.css";
import "./birthday-gallery-redesign.css";
import "./birthday-gift.css";
import { TemplateNavigationRuntime } from "@/templates/navigation/TemplateNavigationRuntime";
import { BirthdayCelestialNavigationAdapter } from "../navigation-adapter";
import confetti from "canvas-confetti";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const POLAROID_CAPTIONS = [
  "✦ Sweet 17",
  "✦ Pure Joy",
  "✦ Treasured",
  "✦ Besties",
];
const OPENING_DURATION_MS = 1750;
const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Birthday+Party+Naya+(Sweet+17th)&dates=20261018T090000Z/20261018T140000Z&details=Mari+rayakan+hari+istimewa+ulang+tahun+bersama+Naya!&location=Sky+Garden,+Bandar+Lampung";

function createBirthdayNavigationAdapter() {
  return new BirthdayCelestialNavigationAdapter();
}

function PartyHorn({ side }: { side: "left" | "right" }) {
  return (
    <div className={`birthday-trumpet birthday-trumpet-${side}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="birthday-trumpet-svg">
        <defs>
          <linearGradient id={`hornGold-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF7D1" />
            <stop offset="45%" stopColor="#EFB94F" />
            <stop offset="100%" stopColor="#B37D1A" />
          </linearGradient>
          <linearGradient id={`hornPink-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFAECB" />
            <stop offset="100%" stopColor="#E05285" />
          </linearGradient>
        </defs>
        <path d="M12 78 C18 64, 8 52, 20 42 C26 36, 22 28, 28 22" stroke={`url(#hornPink-${side})`} strokeWidth="3" strokeLinecap="round" strokeDasharray="3 3" opacity="0.85" />
        <rect x="18" y="70" width="10" height="6" rx="2" fill={`url(#hornGold-${side})`} transform="rotate(-35 18 70)" />
        <path d="M24 67 L68 38 C75 46, 80 54, 60 76 L28 72 Z" fill={`url(#hornGold-${side})`} />
        <path d="M38 58 L46 52 L50 58 L42 64 Z" fill={`url(#hornPink-${side})`} />
        <path d="M52 49 L60 43 L64 50 L56 56 Z" fill={`url(#hornPink-${side})`} />
        <ellipse cx="69" cy="46" rx="6" ry="16" transform="rotate(-35 69 46)" fill={`url(#hornGold-${side})`} stroke="#FFF8E0" strokeWidth="1.5" />
        <ellipse cx="69" cy="46" rx="3.5" ry="12" transform="rotate(-35 69 46)" fill="#3A1856" />
        <circle cx="82" cy="30" r="3" fill="#EFB94F" />
        <circle cx="88" cy="46" r="2.5" fill="#FFAECB" />
        <circle cx="80" cy="58" r="2.5" fill="#A8DED4" />
        <path d="M85 22 L87 27 L92 28 L87 30 L85 35 L83 30 L78 28 L83 27 Z" fill="#FFF7D1" />
        <path d="M78 40 L88 38 M76 50 L86 54" stroke="#EFB94F" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function BirthdayCandles() {
  return (
    <div className="birthday-hero-candles" aria-hidden="true">
      <svg className="birthday-candles-svg" viewBox="0 0 100 82" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="flameGlow1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#FFA500" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFA500" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="flameGlow2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE066" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#FF9933" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF9933" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="flameGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#FFF275" />
            <stop offset="65%" stopColor="#FF8C00" />
            <stop offset="100%" stopColor="#FF3300" />
          </linearGradient>
          <linearGradient id="flameGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#FFF275" />
            <stop offset="65%" stopColor="#FF8C00" />
            <stop offset="100%" stopColor="#FF3300" />
          </linearGradient>
          <linearGradient id="candleBody1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFF9E6" />
            <stop offset="35%" stopColor="#F5D77F" />
            <stop offset="75%" stopColor="#D4A034" />
            <stop offset="100%" stopColor="#9E6E1A" />
          </linearGradient>
          <linearGradient id="candleBody2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFF0F5" />
            <stop offset="35%" stopColor="#F7C5D6" />
            <stop offset="75%" stopColor="#DE789C" />
            <stop offset="100%" stopColor="#AA3860" />
          </linearGradient>
        </defs>

        {/* Ambient floating sparkles */}
        <path d="M22 18 L23.5 21.5 L27 22.5 L23.5 24 L22 27.5 L20.5 24 L17 22.5 L20.5 21.5 Z" fill="#FFE57F" opacity="0.9" />
        <path d="M78 22 L79.5 25.5 L83 26.5 L79.5 28 L78 31.5 L76.5 28 L73 26.5 L76.5 25.5 Z" fill="#FFAECB" opacity="0.9" />
        <circle cx="50" cy="12" r="1.5" fill="#FFF7D1" opacity="0.9" />

        {/* Candle 1 (Left: Taller Celestial Gold) */}
        <g className="candle-group candle-1">
          <circle cx="38" cy="17" r="16" fill="url(#flameGlow1)" className="candle-halo halo-1" />
          <path d="M38 21 Q39 24 38 27" stroke="#5A3D0B" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M38 7 C41 12 44 17 42 21 C40.5 24.5 35.5 24.5 34 21 C32 17 35 12 38 7 Z"
            fill="url(#flameGrad1)"
            className="candle-flame flame-1"
          />
          <path
            d="M38 13 C39.5 16 40.5 18.5 39.5 21 C39 22.5 37 22.5 36.5 21 C35.5 18.5 36.5 16 38 13 Z"
            fill="#FFFFFF"
            opacity="0.92"
          />
          <ellipse cx="38" cy="27" rx="7" ry="2.2" fill="#FFF4D0" />
          <rect x="31" y="27" width="14" height="47" rx="2" fill="url(#candleBody1)" />
          <path d="M31 37 L45 33" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M31 47 L45 43" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M31 57 L45 53" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M31 67 L45 63" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="38" cy="74" rx="9" ry="2.5" fill="rgba(0,0,0,0.35)" />
        </g>

        {/* Candle 2 (Right: Soft Celestial Rose) */}
        <g className="candle-group candle-2">
          <circle cx="62" cy="24" r="14" fill="url(#flameGlow2)" className="candle-halo halo-2" />
          <path d="M62 28 Q61 31 62 34" stroke="#5A1A2E" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M62 14 C65 18.5 67.5 23 66 26.5 C64.5 29.5 60 29.5 58.5 26.5 C57 23 59.5 18.5 62 14 Z"
            fill="url(#flameGrad2)"
            className="candle-flame flame-2"
          />
          <path
            d="M62 19 C63.5 21.5 64.5 23.5 63.8 25.5 C63.2 27 61.2 27 60.5 25.5 C59.8 23.5 60.5 21.5 62 19 Z"
            fill="#FFFFFF"
            opacity="0.92"
          />
          <ellipse cx="62" cy="34" rx="6.5" ry="2" fill="#FFEBF2" />
          <rect x="55.5" y="34" width="13" height="40" rx="2" fill="url(#candleBody2)" />
          <path d="M55.5 43 L68.5 40" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M55.5 52 L68.5 49" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M55.5 61 L68.5 58" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="62" cy="74" rx="8" ry="2.2" fill="rgba(0,0,0,0.35)" />
        </g>
      </svg>
    </div>
  );
}

function ClosingCelebrationGarland() {
  return (
    <div className="birthday-closing-garland-wrap" aria-hidden="true">
      <svg
        viewBox="0 0 360 62"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="birthday-closing-garland-svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="garlandPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFAECB" />
            <stop offset="100%" stopColor="#E05285" />
          </linearGradient>
          <linearGradient id="garlandGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF3C4" />
            <stop offset="50%" stopColor="#EFB94F" />
            <stop offset="100%" stopColor="#B37D1A" />
          </linearGradient>
          <linearGradient id="garlandLilac" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DBC4F0" />
            <stop offset="100%" stopColor="#8060AA" />
          </linearGradient>
          <linearGradient id="garlandMint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D1F2EB" />
            <stop offset="100%" stopColor="#357B78" />
          </linearGradient>
          <linearGradient id="garlandPeach" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE0CC" />
            <stop offset="100%" stopColor="#E89A4D" />
          </linearGradient>
          <filter id="starGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Top fairy lights wire */}
        <path
          d="M -10 6 Q 180 24 370 6"
          stroke="rgba(239, 185, 79, 0.45)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />

        {/* Main curved pennant wire */}
        <path
          d="M -10 10 Q 180 34 370 10"
          stroke="rgba(239, 185, 79, 0.75)"
          strokeWidth="1.2"
        />

        {/* Hanging party flags with subtle drop shadow */}
        <polygon points="16,11 44,14 30,36" fill="url(#garlandPink)" opacity="0.95" />
        <polygon points="64,16 92,20 78,42" fill="url(#garlandGold)" opacity="0.95" />
        <polygon points="112,22 140,25 126,48" fill="url(#garlandMint)" opacity="0.9" />
        <polygon points="164,26 196,26 180,52" fill="url(#garlandLilac)" opacity="0.95" />
        <polygon points="220,25 248,22 234,48" fill="url(#garlandPeach)" opacity="0.9" />
        <polygon points="268,20 296,16 282,42" fill="url(#garlandGold)" opacity="0.95" />
        <polygon points="316,14 344,11 330,36" fill="url(#garlandPink)" opacity="0.95" />

        {/* Dangling star charms on delicate micro-strings */}
        <g filter="url(#starGlow)">
          <line x1="54" y1="15" x2="54" y2="34" stroke="rgba(239, 185, 79, 0.65)" strokeWidth="0.8" />
          <path d="M 54 31 Q 54 35 56 35 Q 54 35 54 39 Q 54 35 52 35 Q 54 35 54 31 Z" fill="#EFB94F" />

          <line x1="102" y1="21" x2="102" y2="44" stroke="rgba(239, 185, 79, 0.65)" strokeWidth="0.8" />
          <path d="M 102 40 Q 102 45 105 45 Q 102 45 102 50 Q 102 45 99 45 Q 102 45 102 40 Z" fill="#FFF2B2" />

          <line x1="180" y1="26" x2="180" y2="58" stroke="rgba(239, 185, 79, 0.75)" strokeWidth="0.8" />
          <path d="M 180 53 Q 180 59 184 59 Q 180 59 180 65 Q 180 59 176 59 Q 180 59 180 53 Z" fill="#FFD700" />

          <line x1="258" y1="21" x2="258" y2="44" stroke="rgba(239, 185, 79, 0.65)" strokeWidth="0.8" />
          <path d="M 258 40 Q 258 45 261 45 Q 258 45 258 50 Q 258 45 255 45 Q 258 45 258 40 Z" fill="#FFF2B2" />

          <line x1="306" y1="15" x2="306" y2="34" stroke="rgba(239, 185, 79, 0.65)" strokeWidth="0.8" />
          <path d="M 306 31 Q 306 35 308 35 Q 306 35 306 39 Q 306 35 304 35 Q 306 35 306 31 Z" fill="#EFB94F" />
        </g>

        {/* Tiny glowing fairy light orbs along the upper string */}
        <circle cx="28" cy="11" r="2" fill="#FFF4D0" filter="url(#starGlow)" />
        <circle cx="76" cy="17" r="2" fill="#FFAECB" filter="url(#starGlow)" />
        <circle cx="126" cy="23" r="2" fill="#A8DED4" filter="url(#starGlow)" />
        <circle cx="180" cy="25" r="2.5" fill="#EFB94F" filter="url(#starGlow)" />
        <circle cx="234" cy="23" r="2" fill="#DBC4F0" filter="url(#starGlow)" />
        <circle cx="284" cy="17" r="2" fill="#FFAECB" filter="url(#starGlow)" />
        <circle cx="332" cy="11" r="2" fill="#FFF4D0" filter="url(#starGlow)" />
      </svg>
    </div>
  );
}

function PartyBunting() {
  return (
    <div className="birthday-bunting-wrap" aria-hidden="true">
      <svg viewBox="0 0 360 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="birthday-bunting-svg" preserveAspectRatio="none">
        <path d="M-10 6 Q 180 30 370 6" stroke="rgba(239, 185, 79, 0.45)" strokeWidth="1.2" strokeDasharray="3 3" />
        <polygon points="20,8 46,11 33,32" fill="#FF8FAB" opacity="0.85" />
        <polygon points="68,13 94,16 81,37" fill="#EFB94F" opacity="0.9" />
        <polygon points="116,18 142,20 129,41" fill="#8060AA" opacity="0.8" />
        <polygon points="166,21 194,21 180,42" fill="#FFAECB" opacity="0.85" />
        <polygon points="218,20 244,18 231,41" fill="#A8DED4" opacity="0.85" />
        <polygon points="266,16 292,13 279,37" fill="#EFB94F" opacity="0.9" />
        <polygon points="314,11 340,8 327,32" fill="#9C70DB" opacity="0.8" />
      </svg>
    </div>
  );
}

function PartyBalloons({ side }: { side: "left" | "right" }) {
  return (
    <div className={`birthday-balloon-cluster birthday-balloon-${side}`} aria-hidden="true">
      <svg viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="birthday-balloon-svg">
        <defs>
          <radialGradient id={`balGold-${side}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFF9E0" />
            <stop offset="50%" stopColor="#EFB94F" />
            <stop offset="100%" stopColor="#B8861B" />
          </radialGradient>
          <radialGradient id={`balPink-${side}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFE4EC" />
            <stop offset="45%" stopColor="#FF7EB3" />
            <stop offset="100%" stopColor="#C93B76" />
          </radialGradient>
          <radialGradient id={`balPurple-${side}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#EADCF9" />
            <stop offset="50%" stopColor="#9C70DB" />
            <stop offset="100%" stopColor="#5B3F88" />
          </radialGradient>
        </defs>

        <path d="M28 56 Q 38 85 35 118" stroke="rgba(239, 185, 79, 0.45)" strokeWidth="1" />
        <path d="M52 46 Q 44 80 37 118" stroke="rgba(255, 126, 179, 0.45)" strokeWidth="1" />

        <g className="balloon-sway-1">
          <ellipse cx="28" cy="40" rx="18" ry="22" fill={`url(#balPurple-${side})`} />
          <polygon points="26,62 30,62 28,65" fill="#7A4EAF" />
          <ellipse cx="22" cy="30" rx="3.5" ry="6" fill="rgba(255,255,255,0.4)" transform="rotate(-20 22 30)" />
        </g>

        <g className="balloon-sway-2">
          <ellipse cx="52" cy="32" rx="16" ry="20" fill={`url(#balGold-${side})`} />
          <polygon points="50,52 54,52 52,55" fill="#B8861B" />
          <ellipse cx="46" cy="24" rx="3" ry="5.5" fill="rgba(255,255,255,0.5)" transform="rotate(-15 46 24)" />
        </g>

        <g className="balloon-sway-3">
          <ellipse cx="38" cy="52" rx="19" ry="23" fill={`url(#balPink-${side})`} />
          <polygon points="36,75 40,75 38,78" fill="#C93B76" />
          <ellipse cx="32" cy="41" rx="3.5" ry="7" fill="rgba(255,255,255,0.55)" transform="rotate(-22 32 41)" />
        </g>
      </svg>
    </div>
  );
}

type Countdown = { days: number; hours: number; minutes: number; seconds: number };

function getBirthdayCountdown(): Countdown {
  const target = new Date("2026-10-18T16:00:00+07:00").getTime();
  const gap = Math.max(0, target - Date.now());
  return {
    days: Math.floor(gap / 86_400_000),
    hours: Math.floor((gap / 3_600_000) % 24),
    minutes: Math.floor((gap / 60_000) % 60),
    seconds: Math.floor((gap / 1_000) % 60),
  };
}

type WishItem = {
  id: string;
  name: string;
  attendance: "Hadir" | "Belum pasti" | "Berhalangan hadir";
  message: string;
  createdAt: string;
};

const INITIAL_WISHES: WishItem[] = [
  {
    id: "w-1",
    name: "Alya Putri",
    attendance: "Hadir",
    message: "Happy sweet 17th birthday Naya! Semoga panjang umur, sehat selalu, dan impianmu tercapai! 🎉✨",
    createdAt: "Baru saja",
  },
  {
    id: "w-2",
    name: "Kak Dimas",
    attendance: "Hadir",
    message: "Selamat ulang tahun Naya! Sukses selalu studinya dan selalu jadi kebanggaan keluarga ya! 🎂",
    createdAt: "1 jam yang lalu",
  },
  {
    id: "w-3",
    name: "Rania & Kevin",
    attendance: "Belum pasti",
    message: "Happy birthday Nayaa! Wish you all the best and happiest year ahead! Nanti kita usahakan hadir yaa 💕",
    createdAt: "3 jam yang lalu",
  },
];

export default function BirthdayCelestialSource({ invitationId, verifiedGuestName }: { invitationId?: string; verifiedGuestName?: string } = {}) {
  const params = useSearchParams();
  const [stage, setStage] = useState<"sealed" | "opening" | "opened">("sealed");
  const [countdown, setCountdown] = useState<Countdown>(getBirthdayCountdown);
  const musicRef = useRef<HTMLAudioElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const openingTimerRef = useRef<number | null>(null);
  const confettiFiredRef = useRef(false);
  const guest = verifiedGuestName || (params.get("for") || params.get("to") || "Sahabat Istimewa").replace(/\+/g, " ");
  const opened = stage === "opened";
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleAudio = useCallback(() => {
    const audio = musicRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isPlaying]);

  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [wishes, setWishes] = useState<WishItem[]>(INITIAL_WISHES);
  const [guestName, setGuestName] = useState(guest !== "Sahabat Istimewa" ? guest : "");
  const [attendance, setAttendance] = useState<"Hadir" | "Belum pasti" | "Berhalangan hadir">("Hadir");
  const [message, setMessage] = useState("");
  const [submittingWish, setSubmittingWish] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [giftCopied, setGiftCopied] = useState<number | null>(null);

  const copyGiftAccount = async (index: 1 | 2) => {
    const field = index === 1 ? "account" : "account2";
    const account = document.querySelector<HTMLElement>(`[data-template-section="gift"] [data-field="${field}"]`)?.textContent?.replaceAll(" ", "") ?? "";
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      setGiftCopied(index);
      window.setTimeout(() => setGiftCopied(null), 1600);
    } catch {
      setGiftCopied(null);
    }
  };

  useEffect(() => {
    const handleGalleryUpdate = (e: Event) => {
      const urls = (e as CustomEvent<{ imageUrls?: string[] }>).detail?.imageUrls;
      if (Array.isArray(urls)) {
        setGalleryImages(urls);
      }
    };
    window.addEventListener("birthday-gallery-update", handleGalleryUpdate);
    return () => window.removeEventListener("birthday-gallery-update", handleGalleryUpdate);
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : 3));
      if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev !== null && prev < 3 ? prev + 1 : 0));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex]);

  useEffect(() => {
    if (guest && guest !== "Sahabat Istimewa") {
      setGuestName(guest);
    }
  }, [guest]);

  useEffect(() => {
    if (!invitationId) return;
    let active = true;
    fetch(`/api/wishes?invitationId=${encodeURIComponent(invitationId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data?.wishes) && data.wishes.length > 0) {
          setWishes(data.wishes);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [invitationId]);

  useEffect(() => {
    if (!wishModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWishModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [wishModalOpen]);

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !message.trim() || submittingWish) return;

    setSubmittingWish(true);
    try {
      const newWish: WishItem = {
        id: `local-${Date.now()}`,
        name: guestName.trim(),
        attendance,
        message: message.trim(),
        createdAt: "Baru saja",
      };

      if (invitationId) {
        try {
          const res = await fetch(`/api/wishes?invitationId=${encodeURIComponent(invitationId)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: guestName.trim(),
              attendance,
              message: message.trim(),
            }),
          });
          const data = await res.json();
          if (data?.wish) {
            newWish.id = data.wish.id;
          }
        } catch {
          // keep local optimistic wish
        }
      }

      setWishes((prev) => [newWish, ...prev]);
      setWishSuccess(true);
      confetti({
        particleCount: 48,
        spread: 60,
        origin: { y: 0.5 },
        colors: ["#efb94f", "#e05285", "#357b78", "#9c70db"],
      });

      window.setTimeout(() => {
        setWishModalOpen(false);
        setWishSuccess(false);
        setMessage("");
      }, 1400);
    } finally {
      setSubmittingWish(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getBirthdayCountdown());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const triggerPartyConfetti = () => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#efb94f", "#efa9b7", "#ffffff", "#a8ded4", "#ffd700", "#ff7eb3", "#9c70db"];
    confetti({
      particleCount: 52,
      angle: 55,
      spread: 56,
      startVelocity: 44,
      origin: { x: 0.12, y: 0.62 },
      colors,
      scalar: 1.0,
      zIndex: 99999,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 52,
      angle: 125,
      spread: 56,
      startVelocity: 44,
      origin: { x: 0.88, y: 0.62 },
      colors,
      scalar: 1.0,
      zIndex: 99999,
      disableForReducedMotion: true,
    });
    window.setTimeout(() => {
      confetti({
        particleCount: 38,
        spread: 75,
        origin: { y: 0.45 },
        colors,
        scalar: 0.95,
        zIndex: 99999,
        disableForReducedMotion: true,
      });
    }, 200);
  };

  const clearOpeningTimer = () => {
    if (openingTimerRef.current !== null) window.clearTimeout(openingTimerRef.current);
    openingTimerRef.current = null;
  };

  const openInvitation = () => {
    if (stage !== "sealed") return;
    setStage("opening");
    openingTimerRef.current = window.setTimeout(() => {
      openingTimerRef.current = null;
      setStage("opened");
      document.querySelector<HTMLElement>("[data-template-scroll-root]")?.scrollTo({ top: 0, behavior: "instant" });
      triggerPartyConfetti();
    }, OPENING_DURATION_MS);
  };

  useEffect(() => {
    const navigate = (event: Event) => {
      const sectionType = (event as CustomEvent<{ sectionType?: string }>).detail?.sectionType;
      if (!sectionType) return;
      clearOpeningTimer();
      setStage(sectionType === "opening-envelope" ? "sealed" : "opened");
    };
    window.addEventListener("birthday-preview-navigate", navigate);
    return () => {
      clearOpeningTimer();
      window.removeEventListener("birthday-preview-navigate", navigate);
    };
  }, []);

  useEffect(() => {
    if (!opened) {
      confettiFiredRef.current = false;
      return;
    }

    if (!confettiFiredRef.current) {
      confettiFiredRef.current = true;
      window.setTimeout(() => {
        triggerPartyConfetti();
      }, 120);
    }

    const audio = musicRef.current;
    const source = audio?.querySelector<HTMLSourceElement>("source");
    const canPlay = Boolean(audio && source && source.getAttribute("src"));
    if (canPlay && audio) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }

    // Periodic celebration confetti every 5.5 seconds while viewing the Hero section
    const confettiInterval = window.setInterval(() => {
      const scrollRoot = document.querySelector<HTMLElement>("[data-template-scroll-root]");
      const isHeroVisible = scrollRoot ? scrollRoot.scrollTop < window.innerHeight * 0.75 : true;
      if (isHeroVisible && !document.hidden) {
        triggerPartyConfetti();
      }
    }, 5500);

    return () => {
      window.clearInterval(confettiInterval);
    };
  }, [opened]);

  return (
    <main className={`birthday-shell birthday-stage-${stage}`} data-template-scroll-root data-template-hydrated="true" data-opened={opened ? "true" : "false"}>
      <TemplateNavigationRuntime createAdapter={createBirthdayNavigationAdapter} />
      <audio ref={musicRef} loop preload="metadata"><source src="/assets/audio/happy-birthday-ukulele.mp3" type="audio/mpeg" /></audio>

      {/* Floating Audio Button - Top Right Safe Zone */}
      {opened && (
        <button
          type="button"
          onClick={toggleAudio}
          className={`birthday-audio-btn ${isPlaying ? "is-playing" : ""}`}
          aria-label={isPlaying ? "Jeda Musik" : "Putar Musik"}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>
      )}

      {!opened && (
        <section className="birthday-envelope-screen" data-template-section="opening-envelope" aria-label="Amplop undangan ulang tahun">
          <div className="birthday-envelope-stars">✦ ✧ ✦</div>
          <p>YOU&apos;RE INVITED TO</p>
          <h1 data-field="title">Naya Turns 17</h1>
          <span data-field="subtitle">18 · 10 · 2026</span>
          <div className="birthday-envelope" aria-live="polite">
            <i />
            <i />
            <div className="birthday-letter">
              <small>Kepada Yth.</small>
              <strong>{guest}</strong>
              <em>Di Tempat</em>
            </div>
            <button type="button" onClick={openInvitation} aria-label="Buka amplop undangan">
              <b>✦</b>
              <small>BUKA</small>
            </button>
          </div>
          <aside>{stage === "opening" ? "Sebentar, undangan sedang dibuka..." : "Ketuk segel bintang untuk membuka"}</aside>
        </section>
      )}

      <section ref={heroRef} className="birthday-hero birthday-hero-full" data-template-section="hero">
        <div className="birthday-stars" />
        <img className="birthday-hero-balloons" src="/assets/birthday/colorful-balloons.png" alt="" aria-hidden="true" />

        {/* ── TOP: Kicker Pill Only (no date in hero) ── */}
        <div className="birthday-hero-top">
          <div className="birthday-hero-kicker" data-field="kicker">✦ HAPPY SWEET 17TH ✦</div>
          <span className="birthday-hero-subtitle" data-field="subtitle" style={{ display: "none" }} aria-hidden="true">Sabtu, 18 Oktober 2026</span>
        </div>

        {/* ── MIDDLE: Giant Star Frame (bleeds left 20%) + Name Title (top-right flank of star) ── */}
        <div className="birthday-hero-mid">
          <div className="birthday-hero-photo-wrap">
            <PartyHorn side="left" />
            <PartyHorn side="right" />

            <div className="birthday-floating-sparkles" aria-hidden="true">
              <span className="sparkle s1">✦</span>
              <span className="sparkle s2">✧</span>
              <span className="sparkle s3">★</span>
              <span className="sparkle s4">✦</span>
              <span className="sparkle s5">✧</span>
            </div>

            <div className="birthday-hero-star-halo" />
            <div className="birthday-hero-star-border">
              <div className="birthday-hero-photo" aria-label="Area foto celebrant">
                <div className="birthday-hero-placeholder">
                  <span className="birthday-hero-placeholder-icon">✦</span>
                  <span className="birthday-hero-placeholder-label">Foto Celebrant</span>
                </div>
              </div>
            </div>
          </div>

          <div className="birthday-hero-title-wrap">
            <h1 className="birthday-hero-title" data-field="title">Happy Birthday, Naya!</h1>
          </div>
        </div>

        {/* ── BOTTOM: 2 Animated Birthday Candles + Warm copy + Guest name + Scroll cue ── */}
        <div className="birthday-hero-bottom">
          <BirthdayCandles />
          <p className="birthday-hero-copy" data-field="copy">
            Mari rayakan hari istimewa ini bersama-sama.
          </p>
          <div className="birthday-hero-guest">
            <span className="birthday-guest-label" data-field="guestLabel">Kepada Yth.</span>
            <strong className="birthday-guest-name">{guest}</strong>
          </div>
          <div className="birthday-scroll-cue">
            <span>SCROLL</span>
            <b>↓</b>
          </div>
        </div>
      </section>

      <section className="birthday-event" data-template-section="event">
        <small className="birthday-event-kicker">YOU&apos;RE INVITED</small>
        <h2 className="birthday-event-title" data-field="title">Birthday Party</h2>

        {/* ── PROMINENT CELEBRATION DATE & TIME CARD (NOTICEABLE DAY & TIME) ── */}
        <div className="birthday-schedule-card" aria-label="Jadwal acara pesta">
          <div className="birthday-schedule-top">
            <span className="birthday-sched-day-badge">HARI &amp; TANGGAL ACARA</span>
            <div className="birthday-sched-date-row">
              <span className="birthday-sched-day-name">Sabtu</span>
              <span className="birthday-sched-dot" aria-hidden="true">·</span>
              <span className="birthday-sched-day-num">18</span>
              <span className="birthday-sched-dot" aria-hidden="true">·</span>
              <span className="birthday-sched-month-year">Oktober 2026</span>
            </div>
          </div>

          <div className="birthday-sched-hairline" aria-hidden="true" />

          <div className="birthday-schedule-bottom">
            <svg className="birthday-sched-clock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="birthday-sched-time-val" data-field="subtitle">
              16.00 WIB sampai selesai
            </span>
          </div>
        </div>

        {/* ── COUNTDOWN & CALENDAR ACTION ── */}
        <div className="birthday-countdown-wrap">
          {/* Festive Floating Balloons placed in this space to avoid covering Birthday Party */}
          <PartyBalloons side="left" />
          <PartyBalloons side="right" />

          <div className="birthday-countdown" aria-label="Hitung mundur pesta ulang tahun">
            <div className="birthday-countdown-item">
              <span className="birthday-countdown-num">{String(countdown.days).padStart(2, "0")}</span>
              <span className="birthday-countdown-lbl">Hari</span>
            </div>
            <div className="birthday-countdown-sep">:</div>
            <div className="birthday-countdown-item">
              <span className="birthday-countdown-num">{String(countdown.hours).padStart(2, "0")}</span>
              <span className="birthday-countdown-lbl">Jam</span>
            </div>
            <div className="birthday-countdown-sep">:</div>
            <div className="birthday-countdown-item">
              <span className="birthday-countdown-num">{String(countdown.minutes).padStart(2, "0")}</span>
              <span className="birthday-countdown-lbl">Menit</span>
            </div>
            <div className="birthday-countdown-sep">:</div>
            <div className="birthday-countdown-item">
              <span className="birthday-countdown-num">{String(countdown.seconds).padStart(2, "0")}</span>
              <span className="birthday-countdown-lbl">Detik</span>
            </div>
          </div>

          <a
            className="birthday-event-btn birthday-calendar-btn"
            href={CALENDAR_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Tambah acara ke Google Calendar"
          >
            <svg className="birthday-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <circle cx="12" cy="15" r="1.5" fill="currentColor" />
            </svg>
            <span>Tambah ke Kalender</span>
          </a>
        </div>

        {/* ── VENUE / LOCATION CARD ── */}
        <div className="birthday-venue-card">
          <small className="birthday-venue-label">LOKASI ACARA</small>

          <address className="birthday-venue-address" data-field="address">
            Sky Garden, Bandar Lampung
          </address>

          <a
            className="birthday-event-btn birthday-map-btn birthday-map-link"
            data-map-link
            href="https://maps.google.com/?q=Sky+Garden+Bandar+Lampung"
            target="_blank"
            rel="noreferrer"
            aria-label="Buka lokasi pesta di Google Maps"
          >
            <svg className="birthday-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span data-field="mapLabel">Buka Google Maps</span>
          </a>
        </div>
      </section>
      <section className="birthday-gallery" data-template-section="gallery">
        <div className="birthday-gallery-content">
          <small className="birthday-gallery-kicker">✦ MEMORIES TO KEEP ✦</small>
          <h2 className="birthday-gallery-title" data-field="title">Little Moments</h2>
          <p className="birthday-gallery-subtitle" data-field="subtitle">Senyum, tawa, dan kenangan.</p>
          <div className="birthday-gallery-grid">
            {[0, 1, 2, 3].map((index) => {
              const url = galleryImages[index];
              return (
                <div
                  key={index}
                  className="birthday-polaroid-card"
                  data-polaroid-index={index}
                  data-gallery-slot={index + 1}
                  onClick={() => setLightboxIndex(index)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Lihat foto kenangan ${index + 1}`}
                >
                  <div className="birthday-polaroid-pin" aria-hidden="true">✦</div>
                  <div className="birthday-polaroid-img-wrap">
                    {url ? (
                      <img className="birthday-polaroid-img" src={url} alt={`Kenangan ${index + 1}`} />
                    ) : (
                      <div className="birthday-gallery-placeholder" data-gallery-slot={index + 1}>
                        <span>✦</span>
                        <small>Foto {index + 1}</small>
                      </div>
                    )}
                    <div className="birthday-polaroid-zoom-hint" aria-hidden="true">
                      <span>🔍 Perbesar</span>
                    </div>
                  </div>
                  <div className="birthday-polaroid-caption">
                    <span>{POLAROID_CAPTIONS[index]}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="birthday-gallery-hint" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Ketuk foto untuk melihat layar penuh</span>
          </div>
        </div>
      </section>
      <section className="birthday-gift" data-template-section="gift">
        <img className="birthday-gift-sparkles" src="/assets/birthday/gift-sparkles.svg" alt="" aria-hidden="true" />
        <img className="birthday-gift-ribbon" src="/assets/birthday/gift-ribbon.svg" alt="" aria-hidden="true" />
        <div className="birthday-gift-orbit" aria-hidden="true"><span>✦</span><span>✦</span><span>✦</span></div>
        <div className="birthday-gift-content">
          <small className="birthday-gift-kicker" data-field="eyebrow">A LITTLE GIFT</small>
          <h2 className="birthday-gift-title" data-field="title">Kirim Hadiah</h2>
          <p className="birthday-gift-subtitle" data-field="subtitle">Kehadiran dan doa terbaikmu sudah sangat berarti. Jika berkenan, hadiah digital dapat dikirim melalui berikut ini.</p>
          <div className="birthday-gift-bank-list" data-gift-bank-area>
          <div className="birthday-gift-card">
            <div className="birthday-gift-bank" data-field="bank">BANK BCA</div>
            <strong className="birthday-gift-account" data-field="account">1234 5678 90</strong>
            <span className="birthday-gift-holder" data-field="holder">a.n. Naya Putri</span>
            <button type="button" className="birthday-gift-copy" onClick={() => copyGiftAccount(1)}>
              <span aria-hidden="true">{giftCopied === 1 ? "✓" : "⧉"}</span><b data-field="copyLabel">{giftCopied === 1 ? "Tersalin" : "Salin nomor"}</b>
            </button>
          </div>
          <div className="birthday-gift-card birthday-gift-card-second" data-gift-second-account hidden>
            <div className="birthday-gift-bank" data-field="bank2">BANK BNI</div>
            <strong className="birthday-gift-account" data-field="account2">0000 0000 00</strong>
            <span className="birthday-gift-holder" data-field="holder2">a.n. Naya Putri</span>
            <button type="button" className="birthday-gift-copy" onClick={() => copyGiftAccount(2)}>
              <span aria-hidden="true">{giftCopied === 2 ? "✓" : "⧉"}</span><b>{giftCopied === 2 ? "Tersalin" : "Salin nomor"}</b>
            </button>
          </div>
          </div>
          <div className="birthday-gift-qris" data-gift-qris-area>
            <img data-gift-qris hidden alt="QRIS hadiah" />
            <div className="birthday-gift-qris-placeholder" data-gift-qris-placeholder><span>✦</span><small>QRIS</small></div>
            <span className="birthday-gift-qris-label" data-field="qrisLabel">Scan QRIS</span>
          </div>
        </div>
      </section>
      <section className="birthday-wishes" data-template-section="wishes">
        {/* Festive Celebration Bunting Flags */}
        <PartyBunting />

        <small className="birthday-wishes-kicker">WITH LOVE</small>
        <h2 className="birthday-wishes-title" data-field="title">Kirim Ucapan</h2>
        <p className="birthday-wishes-subtitle" data-field="subtitle">Doa terbaikmu adalah hadiah yang paling berarti.</p>

        <button
          type="button"
          className="birthday-open-wish-btn"
          onClick={() => setWishModalOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={wishModalOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="birthday-wish-btn-icon" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Tulis Ucapan ✦</span>
        </button>

        {/* Wishes List Stream */}
        <div className="birthday-wish-stream" role="region" aria-label="Daftar ucapan dan doa">
          {wishes.map((item) => (
            <article className="birthday-wish-card" key={item.id}>
              <div className="birthday-wish-card-header">
                <div className="birthday-wish-avatar" aria-hidden="true">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div className="birthday-wish-meta">
                  <strong className="birthday-wish-author">{item.name}</strong>
                  <div className="birthday-wish-subline">
                    <span className={`birthday-attendance-badge is-${item.attendance === "Hadir" ? "attending" : item.attendance === "Belum pasti" ? "maybe" : "absent"}`}>
                      {item.attendance === "Hadir" ? "Hadir" : item.attendance === "Belum pasti" ? "Masih Ragu" : "Berhalangan"}
                    </span>
                    <span className="birthday-wish-time-dot" aria-hidden="true">·</span>
                    <time className="birthday-wish-date">{item.createdAt}</time>
                  </div>
                </div>
              </div>
              <p className="birthday-wish-text">{item.message}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="birthday-closing" data-template-section="closing">
        <ClosingCelebrationGarland />
        <img className="birthday-closing-balloons" src="/assets/birthday/colorful-balloons.png" alt="" aria-hidden="true" />
        <div className="birthday-closing-content">
          <span className="birthday-closing-kicker">THANK YOU FOR CELEBRATING</span>
          <p data-field="title">See You at the Party!</p>
          <span data-field="subtitle">Terima kasih sudah menjadi bagian dari hari bahagia ini.</span>
        </div>
      </footer>

      {/* Wish Modal */}
      {wishModalOpen && (
        <div
          className="birthday-wish-modal-backdrop"
          onClick={() => setWishModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wish-modal-title"
        >
          <div className="birthday-wish-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="birthday-modal-close"
              onClick={() => setWishModalOpen(false)}
              aria-label="Tutup formulir ucapan"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="birthday-modal-header">
              <span className="birthday-modal-kicker">✦ WITH LOVE ✦</span>
              <h3 id="wish-modal-title" className="birthday-modal-title">Tulis Doa &amp; Ucapan</h3>
              <p className="birthday-modal-sub">Berikan pesan hangat untuk hari bahagia ini</p>
            </div>

            {wishSuccess ? (
              <div className="birthday-modal-success" role="status">
                <div className="birthday-success-icon" aria-hidden="true">🎉</div>
                <h4>Terima Kasih Banyak!</h4>
                <p>Ucapan dan doa terbaikmu telah berhasil dikirimkan.</p>
              </div>
            ) : (
              <form className="birthday-wish-form" onSubmit={handleWishSubmit}>
                <div className="birthday-form-group">
                  <label htmlFor="modal-wish-name" className="birthday-field-label">Nama Anda</label>
                  <div className="birthday-input-wrap">
                    <svg className="birthday-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      id="modal-wish-name"
                      type="text"
                      className="birthday-input-text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Nama lengkap atau panggilan"
                      maxLength={50}
                      required
                    />
                  </div>
                </div>

                <div className="birthday-form-group">
                  <label className="birthday-field-label">Konfirmasi Kehadiran</label>
                  <div className="birthday-rsvp-segmented" role="radiogroup">
                    {[
                      { value: "Hadir", label: "Hadir", icon: "🎉" },
                      { value: "Belum pasti", label: "Ragu", icon: "🤔" },
                      { value: "Berhalangan hadir", label: "Absen", icon: "💌" },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.value}
                        className={`birthday-rsvp-pill ${attendance === item.value ? "is-selected" : ""}`}
                        onClick={() => setAttendance(item.value as any)}
                        role="radio"
                        aria-checked={attendance === item.value}
                      >
                        <span className="birthday-rsvp-emoji">{item.icon}</span>
                        <span className="birthday-rsvp-text">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="birthday-form-group">
                  <div className="birthday-label-row">
                    <label htmlFor="modal-wish-msg" className="birthday-field-label">Pesan &amp; Doa</label>
                    <span className="birthday-char-count">{message.length}/300</span>
                  </div>
                  <div className="birthday-input-wrap">
                    <textarea
                      id="modal-wish-msg"
                      className="birthday-input-textarea"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tuliskan ucapan dan doa terbaikmu..."
                      maxLength={300}
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="birthday-submit-wish-btn" disabled={submittingWish}>
                  {submittingWish ? (
                    <span className="birthday-btn-text">Menyimpan ucapan...</span>
                  ) : (
                    <>
                      <span className="birthday-btn-text">Kirim Ucapan</span>
                      <span className="birthday-btn-star" aria-hidden="true">✦</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── INTERACTIVE LIGHTBOX MODAL ── */}
      {lightboxIndex !== null && (
        <div
          className="birthday-lightbox-overlay"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Preview Foto Kenangan"
        >
          <div className="birthday-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="birthday-lightbox-close"
              onClick={() => setLightboxIndex(null)}
              aria-label="Tutup preview foto"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="birthday-lightbox-img-wrap">
              {galleryImages[lightboxIndex] ? (
                <img
                  className="birthday-lightbox-img"
                  src={galleryImages[lightboxIndex]}
                  alt={`Foto kenangan ${lightboxIndex + 1}`}
                />
              ) : (
                <div className="birthday-lightbox-placeholder">
                  <span>✦</span>
                  <strong>Foto Kenangan {lightboxIndex + 1}</strong>
                  <small>Foto dapat diunggah melalui editor galeri di panel samping</small>
                </div>
              )}
            </div>

            <div className="birthday-lightbox-footer">
              <div className="birthday-lightbox-info">
                <span className="birthday-lightbox-tag">✦ MEMORIES TO KEEP</span>
                <strong className="birthday-lightbox-title">{POLAROID_CAPTIONS[lightboxIndex]}</strong>
              </div>

              <div className="birthday-lightbox-nav">
                <button
                  type="button"
                  className="birthday-lightbox-nav-btn"
                  onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : 3))}
                  aria-label="Foto sebelumnya"
                >
                  ←
                </button>
                <span className="birthday-lightbox-counter">{lightboxIndex + 1} / 4</span>
                <button
                  type="button"
                  className="birthday-lightbox-nav-btn"
                  onClick={() => setLightboxIndex((prev) => (prev !== null && prev < 3 ? prev + 1 : 0))}
                  aria-label="Foto selanjutnya"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
