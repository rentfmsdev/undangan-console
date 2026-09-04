"use client";

import { Check, Copy, Megaphone, Monitor, QrCode, Smartphone, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { makeAdminWhatsAppUrl } from "@/config/contact";
import { getPrimaryDemoAd } from "@/config/ads";
import type { TemplateKit } from "@/templates/contracts";

function WhatsAppIcon({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.275-.1-.475-.15-.675.15-.2.3-.775.979-.95 1.18-.175.2-.35.225-.65.075-.3-.15-1.267-.467-2.413-1.489-.892-.796-1.494-1.78-1.669-2.08-.175-.3-.019-.462.131-.612.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.628-.925-2.228-.243-.585-.49-.505-.675-.515-.175-.01-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.028-1.05 2.506 0 1.478 1.075 2.906 1.225 3.106.15.2 2.115 3.23 5.123 4.53.716.31 1.275.495 1.71.633.719.229 1.373.197 1.89.12.577-.087 1.78-.727 2.03-1.428.25-.701.25-1.302.175-1.428-.075-.126-.275-.201-.575-.351z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.982-1.408A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.15 8.15 0 0 1-4.326-1.236l-.31-.184-3.21.907.925-3.132-.202-.322A8.163 8.163 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.521 0 8.2 3.679 8.2 8.2 0 4.521-3.679 8.2-8.2 8.2z"
      />
    </svg>
  );
}

export function DemoTemplateClient({
  template,
  defaultView = "mobile",
}: {
  template: TemplateKit;
  defaultView?: "mobile" | "desktop";
}) {
  const [manualViewport, setManualViewport] = useState<"desktop" | "mobile" | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  const viewport = manualViewport ?? defaultView;
  const primaryAd = getPrimaryDemoAd();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, [template.code]);

  const handleWhatsAppShare = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const path = typeof window !== "undefined" ? window.location.pathname : `/demo/${template.code}`;
    const url = `${origin}${path}`;
    const message = `Hai! Cek template undangan digital "${template.name}" ini di Undangan Studio:\n${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    const url = currentUrl || (typeof window !== "undefined" ? window.location.href : "");
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2400);
    } catch {
      // Fallback manual
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2400);
    }
  };

  return (
    <main className="demo-page-shell">
      <header className="demo-mode-banner">
        <div className="demo-banner-left">
          <Link href="/" className="demo-brand-link" title="Kembali ke Beranda Undangan Studio">
            <div className="demo-brand-logo">
              <Image src="/assets/fav.png" width={32} height={32} alt="Undangan Studio" priority />
            </div>
            <div className="demo-brand-info">
              <span className="demo-brand-title">Undangan Studio</span>
              <span className="demo-brand-subtitle">Marketplace &amp; Builder</span>
            </div>
          </Link>
        </div>

        <div className="demo-mode-copy" role="status">
          <strong>This is for demo mode</strong>
          <span>Preview template · data tamu dinonaktifkan</span>
        </div>

        <div className="demo-banner-actions">
          {/* Scan QR Button */}
          <button
            type="button"
            className="demo-scan-qr-btn"
            onClick={() => setIsQrModalOpen(true)}
            title="Scan QR Code untuk preview di smartphone"
            aria-label="Scan QR Code"
          >
            <QrCode size={15} />
            <span className="demo-btn-label">Scan QR</span>
          </button>

          {/* Viewport Switch */}
          <div className="demo-viewport-switch" aria-label="Pilih ukuran viewport">
            <button
              type="button"
              className={viewport === "desktop" ? "is-active" : undefined}
              aria-pressed={viewport === "desktop"}
              onClick={() => setManualViewport("desktop")}
            >
              <Monitor size={15} />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              className={viewport === "mobile" ? "is-active" : undefined}
              aria-pressed={viewport === "mobile"}
              onClick={() => setManualViewport("mobile")}
            >
              <Smartphone size={15} />
              <span>Mobile</span>
            </button>
          </div>

          {/* CTA Gunakan Template */}
          <Link
            href={`/editor/${template.code}`}
            className="demo-use-template-btn"
            title={`Gunakan template ${template.name} untuk undangan Anda`}
          >
            <span>Gunakan Template</span>
          </Link>
        </div>
      </header>

      <section className={`demo-preview-canvas is-${viewport}`}>
        <div className="demo-viewport-frame">
          <div className="demo-frame-chrome" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>{viewport === "desktop" ? "Desktop viewport" : "Mobile viewport · 390px"}</span>
          </div>
          <div className="demo-template-stage">
            <iframe
              title={`Demo ${template.name} · ${viewport}`}
              src={`/template-preview?template=${encodeURIComponent(template.code)}`}
            />
          </div>
        </div>
      </section>

      {/* Floating Left Ad Space (Dynamic via config/ads.ts) */}
      {primaryAd && (
        <aside className="demo-floating-ad" aria-label="Ruang Iklan">
          <div className="demo-floating-ad-inner">
            <span className="demo-floating-ad-tag">{primaryAd.badge || "Iklan"}</span>
            {primaryAd.imageUrl && !primaryAd.isPlaceholder ? (
              <div className="demo-floating-ad-img-wrap">
                <img src={primaryAd.imageUrl} alt={primaryAd.title} className="demo-floating-ad-img" />
              </div>
            ) : (
              <div className="demo-floating-ad-icon" aria-hidden="true">
                <Megaphone size={20} />
              </div>
            )}
            <strong className="demo-floating-ad-title">{primaryAd.title}</strong>
            <p className="demo-floating-ad-desc">{primaryAd.description}</p>
            <a
              href={
                primaryAd.linkUrl && !primaryAd.isPlaceholder
                  ? primaryAd.linkUrl
                  : makeAdminWhatsAppUrl(`Halo Admin Undangan Studio, saya berminat memasang iklan di halaman demo template ${template.name}.`)
              }
              target="_blank"
              rel="noopener noreferrer"
              className="demo-floating-ad-btn"
            >
              {primaryAd.ctaText || "Pasang Iklan"}
            </a>
          </div>
        </aside>
      )}

      {/* Floating Share (WhatsApp + Salin Tautan) */}
      <div className="demo-floating-share-wrapper">
        {copiedToast && (
          <div className="demo-copy-toast" role="status">
            <Check size={14} className="text-emerald-400" />
            <span>Tautan berhasil disalin!</span>
          </div>
        )}
        <div className="demo-floating-share-group">
          <button
            type="button"
            className="demo-share-wa-btn"
            onClick={handleWhatsAppShare}
            title={`Bagikan template ${template.name} ke WhatsApp teman`}
            aria-label="Bagikan ke WhatsApp"
          >
            <span className="demo-floating-share-pulse" aria-hidden="true" />
            <WhatsAppIcon size={19} />
            <span>Bagikan</span>
          </button>
          <div className="demo-share-divider" aria-hidden="true" />
          <button
            type="button"
            className="demo-share-copy-btn"
            onClick={handleCopyLink}
            title="Salin tautan demo ini"
            aria-label="Salin Link"
          >
            <Copy size={15} />
            <span>Salin Link</span>
          </button>
        </div>
      </div>

      {/* QR Code Modal for Mobile Preview */}
      {isQrModalOpen && (
        <div
          className="demo-modal-backdrop"
          onClick={() => setIsQrModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="demo-qr-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="demo-qr-close-btn"
              aria-label="Tutup modal"
            >
              <X size={18} />
            </button>
            <div className="demo-qr-header">
              <h3 className="demo-qr-title">Preview di Ponsel Anda</h3>
              <p className="demo-qr-desc">
                Arahkan kamera smartphone ke kode QR di bawah untuk membuka demo interaktif secara instan.
              </p>
            </div>
            <div className="demo-qr-box">
              {currentUrl ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=6&data=${encodeURIComponent(currentUrl)}`}
                  alt={`QR Code Demo ${template.name}`}
                  width={180}
                  height={180}
                  className="demo-qr-img"
                />
              ) : (
                <div className="demo-qr-loading">Memuat QR Code…</div>
              )}
            </div>
            <div className="demo-qr-copy-bar">
              <span className="demo-qr-url-text">{currentUrl || `/demo/${template.code}`}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="demo-qr-copy-action"
              >
                <Copy size={13} />
                <span>{copiedToast ? "Tersalin!" : "Salin"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
