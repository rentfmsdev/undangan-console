"use client";

import React, { useEffect, useState } from "react";

export function KhitanCountdown({ targetDate = "2026-11-15T08:30:00+07:00" }: { targetDate?: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    completed: false,
  });

  useEffect(() => {
    function calculate() {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, completed: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, completed: false });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="khitan-countdown-wrap">
      <p className="khitan-countdown-title">✦ HITUNG MUNDUR ACARA ✦</p>
      <div className="khitan-countdown-grid">
        <div className="khitan-countdown-box">
          <span className="khitan-countdown-num">{String(timeLeft.days).padStart(2, "0")}</span>
          <span className="khitan-countdown-label">Hari</span>
        </div>
        <div className="khitan-countdown-box">
          <span className="khitan-countdown-num">{String(timeLeft.hours).padStart(2, "0")}</span>
          <span className="khitan-countdown-label">Jam</span>
        </div>
        <div className="khitan-countdown-box">
          <span className="khitan-countdown-num">{String(timeLeft.minutes).padStart(2, "0")}</span>
          <span className="khitan-countdown-label">Menit</span>
        </div>
        <div className="khitan-countdown-box">
          <span className="khitan-countdown-num">{String(timeLeft.seconds).padStart(2, "0")}</span>
          <span className="khitan-countdown-label">Detik</span>
        </div>
      </div>
    </div>
  );
}
