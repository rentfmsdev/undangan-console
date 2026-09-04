"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, Grid, Play, ImageIcon } from "lucide-react";

type Props = {
  images: string[];
};

export function AqiqahGallery({ images }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({});

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const dragStartX = useRef<number | null>(null);

  const effectiveImages =
    images.length > 0
      ? images
      : [
          "/assets/aqiqah/baby-portrait.png",
          "/assets/aqiqah/baby-landscape.png",
        ];
  const len = effectiveImages.length;

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
      if (e.key === "Escape") setLightboxIndex(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxIndex]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : len - 1));
  }, [len]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev < len - 1 ? prev + 1 : 0));
  }, [len]);

  const prevLightbox = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : len - 1));
  }, [len]);

  const nextLightbox = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null && prev < len - 1 ? prev + 1 : 0));
  }, [len]);

  // Touch swipe handlers for carousel
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx > 0) prevSlide(); else nextSlide();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  // Mouse drag handlers for carousel
  function handleMouseDown(e: React.MouseEvent) {
    dragStartX.current = e.clientX;
    setIsDragging(false);
  }
  function handleMouseMove(e: React.MouseEvent) {
    if (dragStartX.current !== null && Math.abs(e.clientX - dragStartX.current) > 5) {
      setIsDragging(true);
    }
  }
  function handleMouseUp(e: React.MouseEvent) {
    if (dragStartX.current !== null) {
      const dx = e.clientX - dragStartX.current;
      if (Math.abs(dx) > 50) {
        if (dx > 0) prevSlide(); else nextSlide();
      }
    }
    dragStartX.current = null;
  }

  const handleImgLoad = (idx: number) => {
    setImgLoaded((prev) => ({ ...prev, [idx]: true }));
  };

  return (
    <div className="ag-gallery">
      {/* ── Mode Toggle ── */}
      <div className="ag-toggle-row">
        <button
          type="button"
          className={`ag-toggle-pill ${viewMode === "carousel" ? "ag-toggle-pill--active" : ""}`}
          onClick={() => setViewMode("carousel")}
        >
          <Play size={12} />
          <span>Slideshow</span>
        </button>
        <button
          type="button"
          className={`ag-toggle-pill ${viewMode === "grid" ? "ag-toggle-pill--active" : ""}`}
          onClick={() => setViewMode("grid")}
        >
          <Grid size={12} />
          <span>Grid</span>
        </button>
      </div>

      {viewMode === "carousel" ? (
        /* ── Carousel ── */
        <div className="ag-carousel">
          {/* Main card */}
          <div
            className="ag-carousel-stage"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Prev sibling preview */}
            {len > 1 && (
              <div
                className="ag-carousel-peek ag-carousel-peek--prev"
                onClick={prevSlide}
                aria-label="Foto sebelumnya"
              >
                <img
                  src={effectiveImages[(currentIndex - 1 + len) % len]}
                  alt=""
                  className="ag-carousel-peek-img"
                />
              </div>
            )}

            {/* Active card */}
            <div
              className="ag-carousel-card"
              onClick={() => { if (!isDragging) setLightboxIndex(currentIndex); }}
            >
              {!imgLoaded[currentIndex] && (
                <div className="ag-carousel-skeleton">
                  <ImageIcon size={28} className="text-rose-200" />
                </div>
              )}
              <img
                src={effectiveImages[currentIndex]}
                alt={`Momen ${currentIndex + 1}`}
                className="ag-carousel-img"
                style={{ opacity: imgLoaded[currentIndex] ? 1 : 0 }}
                onLoad={() => handleImgLoad(currentIndex)}
                draggable={false}
              />

              {/* Counter badge */}
              <div className="ag-badge ag-badge--counter">
                {currentIndex + 1} / {len}
              </div>

              {/* Zoom hint */}
              <div className="ag-badge ag-badge--zoom">
                <ZoomIn size={13} />
                <span>Lihat Penuh</span>
              </div>
            </div>

            {/* Next sibling preview */}
            {len > 1 && (
              <div
                className="ag-carousel-peek ag-carousel-peek--next"
                onClick={nextSlide}
                aria-label="Foto selanjutnya"
              >
                <img
                  src={effectiveImages[(currentIndex + 1) % len]}
                  alt=""
                  className="ag-carousel-peek-img"
                />
              </div>
            )}
          </div>

          {/* Arrow buttons */}
          {len > 1 && (
            <>
              <button
                type="button"
                className="ag-arrow ag-arrow--prev"
                onClick={prevSlide}
                aria-label="Foto sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="ag-arrow ag-arrow--next"
                onClick={nextSlide}
                aria-label="Foto selanjutnya"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Dot indicators */}
          <div className="ag-dots">
            {effectiveImages.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`ag-dot ${i === currentIndex ? "ag-dot--active" : ""}`}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      ) : (
        /* ── Grid ── */
        <div className="ag-grid">
          {effectiveImages.map((src, idx) => (
            <button
              key={idx}
              type="button"
              className="ag-grid-item"
              onClick={() => setLightboxIndex(idx)}
              aria-label={`Buka foto ${idx + 1}`}
            >
              <img src={src} alt={`Momen ${idx + 1}`} className="ag-grid-img" />
              <div className="ag-grid-overlay">
                <div className="ag-grid-zoom-icon">
                  <ZoomIn size={16} />
                </div>
              </div>
              <div className="ag-grid-num">{idx + 1}</div>
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <div
          className="ag-lightbox"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Lihat foto penuh"
        >
          {/* Close */}
          <button
            type="button"
            className="ag-lightbox-close"
            onClick={() => setLightboxIndex(null)}
            aria-label="Tutup"
          >
            <X size={20} />
          </button>

          {/* Image */}
          <div
            className="ag-lightbox-body"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={effectiveImages[lightboxIndex]}
              alt={`Momen ${lightboxIndex + 1}`}
              className="ag-lightbox-img"
            />
          </div>

          {/* Navigation */}
          {len > 1 && (
            <>
              <button
                type="button"
                className="ag-lightbox-nav ag-lightbox-nav--prev"
                onClick={(e) => { e.stopPropagation(); prevLightbox(); }}
                aria-label="Foto sebelumnya"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                className="ag-lightbox-nav ag-lightbox-nav--next"
                onClick={(e) => { e.stopPropagation(); nextLightbox(); }}
                aria-label="Foto selanjutnya"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Footer */}
          <div className="ag-lightbox-footer" onClick={(e) => e.stopPropagation()}>
            <span className="ag-lightbox-counter">{lightboxIndex + 1} / {len}</span>
          </div>
        </div>
      )}
    </div>
  );
}
