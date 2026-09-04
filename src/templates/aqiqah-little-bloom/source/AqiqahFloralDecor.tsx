"use client";

import React from "react";

/**
 * Watercolor Floral Wreath around the baby photo frame
 * Modeled closely after the user's reference image with blooming roses, peonies,
 * buds, and soft eucalyptus leaves arching along the frame.
 */
export function AqiqahFrameWreath() {
  return (
    <div className="aqiqah-wreath-wrap" aria-hidden="true">
      {/* Upper-left arch floral garland */}
      <svg
        className="aqiqah-wreath-svg-tl"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Watercolor Leaves */}
        <path
          d="M32 105C24 90 28 68 40 55C46 48 56 42 66 40C62 52 56 64 48 76C42 86 36 96 32 105Z"
          fill="#A3C4AC"
          opacity="0.85"
        />
        <path
          d="M48 65C38 52 44 34 58 26C66 22 76 20 86 22C80 32 72 42 62 50C56 56 52 61 48 65Z"
          fill="#B8D5BF"
          opacity="0.9"
        />
        <path
          d="M75 35C70 20 82 8 98 6C108 5 118 8 126 14C116 20 106 26 96 30C88 33 81 34 75 35Z"
          fill="#8EAFA0"
          opacity="0.8"
        />

        {/* Delicate Golden Stems */}
        <path
          d="M20 120C30 90 55 50 105 25"
          stroke="#C5A059"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="2 3"
          opacity="0.75"
        />

        {/* Blooming Rose / Peony Petals */}
        <g transform="translate(48, 52)">
          {/* Peony 1 */}
          <circle cx="0" cy="0" r="18" fill="#FCE8EC" />
          <path
            d="M-12 -6C-16 6 -8 16 4 16C14 16 18 6 12 -6C8 -14 -4 -14 -12 -6Z"
            fill="#F8B4C0"
            opacity="0.9"
          />
          <path
            d="M-8 -2C-10 6 -4 11 4 11C10 11 12 5 8 -2C5 -7 -3 -7 -8 -2Z"
            fill="#E58498"
            opacity="0.85"
          />
          <circle cx="0" cy="1" r="5" fill="#D96B84" />
          <circle cx="1" cy="0" r="2.5" fill="#FFF2C6" />
        </g>

        {/* Second Flower (Warm Cream Peony) */}
        <g transform="translate(85, 28)">
          <circle cx="0" cy="0" r="14" fill="#FFF4E6" />
          <path
            d="M-10 -4C-12 5 -6 12 3 12C10 12 14 5 9 -4C6 -10 -3 -10 -10 -4Z"
            fill="#F4D3BA"
            opacity="0.85"
          />
          <path
            d="M-6 -1C-8 4 -4 8 2 8C7 8 8 4 5 -1C3 -4 -3 -4 -6 -1Z"
            fill="#DEAB8B"
            opacity="0.85"
          />
          <circle cx="0" cy="0" r="3.5" fill="#D4946F" />
        </g>

        {/* Small Floral Buds & Berries */}
        <circle cx="28" cy="88" r="4.5" fill="#F8B4C0" />
        <circle cx="34" cy="94" r="3.5" fill="#FCE8EC" />
        <circle cx="112" cy="18" r="4" fill="#F8B4C0" />
        <circle cx="120" cy="22" r="3" fill="#FFF4E6" />
      </svg>

      {/* Lower-right corner floral wreath accent */}
      <svg
        className="aqiqah-wreath-svg-br"
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M45 40C62 48 72 65 75 82C77 92 75 102 70 112C62 102 54 92 48 80C44 70 43 55 45 40Z"
          fill="#A3C4AC"
          opacity="0.85"
        />
        <path
          d="M70 75C85 85 90 102 85 118C82 126 76 134 68 140C68 128 70 116 72 104C72 94 70 85 70 75Z"
          fill="#B8D5BF"
          opacity="0.9"
        />

        {/* Blooming Blossom on Lower-Right */}
        <g transform="translate(68, 80)">
          <circle cx="0" cy="0" r="16" fill="#FCE8EC" />
          <path
            d="M-11 -5C-14 5 -7 13 3 13C12 13 15 5 10 -5C6 -11 -4 -11 -11 -5Z"
            fill="#F8B4C0"
            opacity="0.9"
          />
          <path
            d="M-7 -2C-9 4 -4 9 3 9C8 9 10 4 7 -2C4 -6 -2 -6 -7 -2Z"
            fill="#E58498"
            opacity="0.85"
          />
          <circle cx="0" cy="1" r="4" fill="#D96B84" />
          <circle cx="0" cy="0" r="2" fill="#FFF2C6" />
        </g>

        {/* Little Cream Bloom */}
        <g transform="translate(42, 102)">
          <circle cx="0" cy="0" r="11" fill="#FFF5EA" />
          <circle cx="0" cy="0" r="6" fill="#E8C3A7" opacity="0.85" />
          <circle cx="0" cy="0" r="2.5" fill="#D4946F" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Watercolor Corner Bouquets with gentle breeze animation
 */
export function AqiqahCornerFloral({
  position = "top-left",
}: {
  position?: "top-left" | "bottom-right";
}) {
  if (position === "top-left") {
    return (
      <div className="aqiqah-corner-floral-tl" aria-hidden="true">
        <svg
          viewBox="0 0 220 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="aqiqah-corner-svg"
        >
          {/* Large watercolor eucalyptus / sage leaves */}
          <path
            d="M0 60C30 50 65 65 85 95C95 110 100 130 95 150C80 135 65 120 45 105C30 95 15 80 0 60Z"
            fill="#9ABFA4"
            opacity="0.85"
          />
          <path
            d="M40 0C55 25 50 60 35 85C25 100 10 115 -10 120C-5 100 5 80 15 60C25 40 30 20 40 0Z"
            fill="#B2D1BA"
            opacity="0.8"
          />
          <path
            d="M80 15C105 35 115 70 110 100C105 115 95 130 80 140C80 120 85 100 85 80C85 60 80 35 80 15Z"
            fill="#7EA38B"
            opacity="0.85"
          />

          {/* Big Pink Rose/Peony */}
          <g transform="translate(70, 70)">
            <circle cx="0" cy="0" r="38" fill="#FCEBF0" />
            <circle cx="-3" cy="2" r="30" fill="#F7B7C3" opacity="0.9" />
            <path
              d="M-22 -8C-28 10 -15 28 8 28C24 28 32 10 22 -8C15 -22 -8 -22 -22 -8Z"
              fill="#EC8EA1"
              opacity="0.88"
            />
            <path
              d="M-14 -4C-18 8 -9 18 5 18C16 18 21 8 14 -4C9 -13 -5 -13 -14 -4Z"
              fill="#D9637C"
              opacity="0.85"
            />
            <circle cx="0" cy="2" r="8" fill="#C24461" />
            <circle cx="0" cy="0" r="4" fill="#FFF2C6" />
          </g>

          {/* Cream Peony */}
          <g transform="translate(135, 45)">
            <circle cx="0" cy="0" r="26" fill="#FFF5EA" />
            <circle cx="-2" cy="1" r="20" fill="#F3D5BD" opacity="0.9" />
            <path
              d="M-14 -5C-18 6 -10 18 4 18C15 18 20 6 14 -5C9 -14 -5 -14 -14 -5Z"
              fill="#E1B394"
              opacity="0.85"
            />
            <circle cx="0" cy="1" r="6" fill="#CC8F69" />
            <circle cx="0" cy="0" r="3" fill="#FFF7DF" />
          </g>

          {/* Small buds & leaves spreading inward */}
          <circle cx="165" cy="85" r="7" fill="#F7B7C3" />
          <circle cx="180" cy="98" r="5" fill="#FCEBF0" />
          <circle cx="85" cy="155" r="7" fill="#F7B7C3" />
          <circle cx="95" cy="172" r="5" fill="#FFF5EA" />
        </svg>
      </div>
    );
  }

  return (
    <div className="aqiqah-corner-floral-br" aria-hidden="true">
      <svg
        viewBox="0 0 220 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="aqiqah-corner-svg"
      >
        {/* Watercolor eucalyptus / sage leaves */}
        <path
          d="M220 160C190 170 155 155 135 125C125 110 120 90 125 70C140 85 155 100 175 115C190 125 205 140 220 160Z"
          fill="#9ABFA4"
          opacity="0.85"
        />
        <path
          d="M180 220C165 195 170 160 185 135C195 120 210 105 230 100C225 120 215 140 205 160C195 180 190 200 180 220Z"
          fill="#B2D1BA"
          opacity="0.8"
        />

        {/* Big Cream & Gold Flower */}
        <g transform="translate(145, 145)">
          <circle cx="0" cy="0" r="36" fill="#FFF5EA" />
          <circle cx="2" cy="-2" r="28" fill="#F3D5BD" opacity="0.9" />
          <path
            d="M-20 -8C-26 8 -14 24 6 24C22 24 28 8 19 -8C13 -20 -7 -20 -20 -8Z"
            fill="#E1B394"
            opacity="0.88"
          />
          <circle cx="0" cy="1" r="7" fill="#CC8F69" />
          <circle cx="0" cy="0" r="3.5" fill="#FFF7DF" />
        </g>

        {/* Soft Pink Rose */}
        <g transform="translate(85, 170)">
          <circle cx="0" cy="0" r="28" fill="#FCEBF0" />
          <circle cx="2" cy="-1" r="22" fill="#F7B7C3" opacity="0.9" />
          <path
            d="M-15 -6C-20 6 -11 18 4 18C16 18 22 6 15 -6C10 -15 -5 -15 -15 -6Z"
            fill="#D9637C"
            opacity="0.85"
          />
          <circle cx="0" cy="1" r="6" fill="#C24461" />
        </g>

        {/* Buds & Sprigs */}
        <circle cx="55" cy="130" r="6.5" fill="#F7B7C3" />
        <circle cx="42" cy="115" r="5" fill="#FCEBF0" />
        <circle cx="130" cy="65" r="6" fill="#F3D5BD" />
      </svg>
    </div>
  );
}

/**
 * Pastel ABC Baby Building Blocks (as in the reference image)
 */
export function AqiqahBabyBlocks({
  position = "top-right",
}: {
  position?: "top-right" | "bottom-left";
}) {
  if (position === "top-right") {
    return (
      <div className="aqiqah-blocks-tr" aria-hidden="true">
        {/* Block B */}
        <div className="aqiqah-block aqiqah-block-b">
          <span>B</span>
        </div>
        <div className="aqiqah-blocks-row">
          {/* Block A */}
          <div className="aqiqah-block aqiqah-block-a">
            <span>A</span>
          </div>
          {/* Block C */}
          <div className="aqiqah-block aqiqah-block-c">
            <span>C</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aqiqah-blocks-bl" aria-hidden="true">
      {/* Block B */}
      <div className="aqiqah-block aqiqah-block-b">
        <span>B</span>
      </div>
      <div className="aqiqah-blocks-row">
        {/* Block A */}
        <div className="aqiqah-block aqiqah-block-a">
          <span>A</span>
        </div>
        {/* Block C */}
        <div className="aqiqah-block aqiqah-block-c">
          <span>C</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 3D Embossed Luxury Gold Wax Seal with organic melted contour and baby feet emblem
 */
export function AqiqahWaxSeal({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      className="aqiqah-wax-seal-btn"
      onClick={onClick}
      title="Sentuh untuk membuka undangan"
      aria-label="Segel Emas Buka Undangan"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="aqiqah-wax-seal-svg"
      >
        <defs>
          <radialGradient id="aqiqahWaxGold" cx="35%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#fff6c7" />
            <stop offset="25%" stopColor="#f4cf6a" />
            <stop offset="55%" stopColor="#cf9b2a" />
            <stop offset="85%" stopColor="#9b7012" />
            <stop offset="100%" stopColor="#6e4d07" />
          </radialGradient>
          <radialGradient id="aqiqahWaxRim" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#d8a638" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6e4d07" stopOpacity="0.8" />
          </radialGradient>
          <filter id="waxGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#87620a" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Organic Melted Wax Outer Shape */}
        <path
          d="M50 4 C62 3 73 9 82 17 C91 26 97 38 96 50 C95 62 88 74 79 82 C70 90 58 96 46 95 C33 94 21 87 13 77 C5 67 4 54 6 42 C8 29 18 17 29 10 C36 6 43 4 50 4 Z"
          fill="url(#aqiqahWaxGold)"
          filter="url(#waxGlow)"
        />

        {/* Outer Wax Highlights */}
        <path
          d="M50 4 C62 3 73 9 82 17 C91 26 97 38 96 50"
          stroke="#fff7d6"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* Inner Wax Recessed Well */}
        <circle cx="50" cy="50" r="33" fill="#ab7c18" opacity="0.3" />
        <circle cx="50" cy="50" r="32" stroke="url(#aqiqahWaxRim)" strokeWidth="2" fill="none" />

        {/* Beaded Stamped Ring */}
        <circle
          cx="50"
          cy="50"
          r="28"
          stroke="#fff6c7"
          strokeWidth="1.2"
          strokeDasharray="2.5 3"
          fill="none"
          opacity="0.8"
        />

        {/* Center Stamped Baby Footprints & Sparkles Emblem */}
        <g transform="translate(50, 50)" fill="#fffbe6" opacity="0.95">
          {/* Left Little Baby Footprint */}
          <g transform="translate(-8, -4) rotate(-8) scale(0.65)">
            <path d="M0 0 C4 0 7 6 7 14 C7 20 4 24 0 24 C-4 24 -6 19 -6 13 C-6 6 -3 0 0 0 Z" />
            <circle cx="-4" cy="-5" r="2.2" />
            <circle cx="-1" cy="-7" r="2.5" />
            <circle cx="2.5" cy="-6" r="2.2" />
            <circle cx="5.5" cy="-4" r="1.8" />
            <circle cx="7.5" cy="-1.5" r="1.4" />
          </g>

          {/* Right Little Baby Footprint */}
          <g transform="translate(8, -1) rotate(8) scale(0.65)">
            <path d="M0 0 C3 0 6 6 6 13 C6 19 4 24 0 24 C-4 24 -7 20 -7 14 C-7 6 -4 0 0 0 Z" />
            <circle cx="4" cy="-5" r="2.2" />
            <circle cx="1" cy="-7" r="2.5" />
            <circle cx="-2.5" cy="-6" r="2.2" />
            <circle cx="-5.5" cy="-4" r="1.8" />
            <circle cx="-7.5" cy="-1.5" r="1.4" />
          </g>

          {/* Golden Star Sparkles */}
          <path
            d="M0 -15 L1.5 -11.5 L5 -10 L1.5 -8.5 L0 -5 L-1.5 -8.5 L-5 -10 L-1.5 -11.5 Z"
            fill="#ffffff"
          />
        </g>
      </svg>
    </button>
  );
}

/**
 * Realistic Triangular Envelope Flap with Golden Stitched Edges
 */
export function AqiqahEnvelopeFlap() {
  return (
    <svg
      viewBox="0 0 360 85"
      preserveAspectRatio="none"
      className="aqiqah-envelope-flap-svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="flapPaperGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#fdf3f5" />
          <stop offset="100%" stopColor="#f7e1e6" />
        </linearGradient>
        <linearGradient id="flapGoldTrim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e3b646" />
          <stop offset="50%" stopColor="#fae7a0" />
          <stop offset="100%" stopColor="#e3b646" />
        </linearGradient>
        <filter id="flapShadow" x="-5%" y="0%" width="110%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="rgba(160, 70, 90, 0.16)" />
        </filter>
      </defs>

      {/* Main Triangular Flap */}
      <path
        d="M0 0 L360 0 L180 80 Z"
        fill="url(#flapPaperGrad)"
        filter="url(#flapShadow)"
      />

      {/* Golden V-Trim */}
      <path
        d="M0 0 L180 80 L360 0"
        stroke="url(#flapGoldTrim)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Delicate Inner Stitched Line */}
      <path
        d="M16 4 L180 72 L344 4"
        stroke="#c99f36"
        strokeWidth="1.2"
        strokeDasharray="4 4"
        fill="none"
        opacity="0.55"
      />
    </svg>
  );
}
