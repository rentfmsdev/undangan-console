"use client";

import React, { useState, useRef } from "react";

type Props = {
  images: string[];
  onOpenLightbox: (index: number) => void;
};

export function Khitan3DGallery({ images, onOpenLightbox }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"3d" | "grid">("3d");
  const touchStartX = useRef<number | null>(null);

  const len = images.length;

  function prevSlide() {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : len - 1));
  }

  function nextSlide() {
    setCurrentIndex((prev) => (prev < len - 1 ? prev + 1 : 0));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 45) {
      prevSlide();
    } else if (diff < -45) {
      nextSlide();
    }
    touchStartX.current = null;
  }

  function handleCardClick(idx: number) {
    if (idx === currentIndex) {
      onOpenLightbox(idx);
    } else {
      setCurrentIndex(idx);
    }
  }

  return (
    <div className="khitan-3d-gallery-wrapper">
      {/* View Mode Toggle Button */}
      <div className="khitan-gallery-mode-toggle">
        <button
          type="button"
          className={`khitan-toggle-pill ${viewMode === "3d" ? "is-active" : ""}`}
          onClick={() => setViewMode("3d")}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
          <span>3D Coverflow</span>
        </button>
        <button
          type="button"
          className={`khitan-toggle-pill ${viewMode === "grid" ? "is-active" : ""}`}
          onClick={() => setViewMode("grid")}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
          <span>Grid Album</span>
        </button>
      </div>

      {viewMode === "3d" ? (
        <div
          className="khitan-coverflow-viewport"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="khitan-coverflow-stage">
            {images.map((src, idx) => {
              const offset = idx - currentIndex;
              let posClass = "khitan-card-hidden";
              if (offset === 0) posClass = "khitan-card-active";
              else if (offset === -1 || (currentIndex === 0 && idx === len - 1)) posClass = "khitan-card-prev";
              else if (offset === 1 || (currentIndex === len - 1 && idx === 0)) posClass = "khitan-card-next";

              return (
                <div
                  key={idx}
                  className={`khitan-coverflow-card ${posClass}`}
                  onClick={() => handleCardClick(idx)}
                >
                  <div className="khitan-coverflow-inner">
                    <img src={src} alt={`Potret Ananda ${idx + 1}`} loading="lazy" />
                    {offset === 0 && (
                      <div className="khitan-card-badge-zoom">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                        <span>Perbesar</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="khitan-coverflow-controls">
            <button
              type="button"
              className="khitan-coverflow-arrow"
              onClick={prevSlide}
              aria-label="Foto sebelumnya"
            >
              ‹
            </button>
            <div className="khitan-coverflow-dots">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`khitan-coverflow-dot ${idx === currentIndex ? "is-active" : ""}`}
                  onClick={() => setCurrentIndex(idx)}
                />
              ))}
            </div>
            <button
              type="button"
              className="khitan-coverflow-arrow"
              onClick={nextSlide}
              aria-label="Foto selanjutnya"
            >
              ›
            </button>
          </div>
        </div>
      ) : (
        /* Grid Album Mode */
        <div className="khitan-gallery-grid">
          {images.map((src, idx) => (
            <div
              key={idx}
              className="khitan-gallery-item"
              onClick={() => onOpenLightbox(idx)}
              role="button"
              tabIndex={0}
              aria-label={`Buka foto ke-${idx + 1}`}
            >
              <img src={src} alt={`Foto Ananda ${idx + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
