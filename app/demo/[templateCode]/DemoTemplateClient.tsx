"use client";

import { Monitor, Smartphone } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import type { TemplateKit } from "@/templates/contracts";

const mobileViewportQuery = "(max-width: 767px)";

function subscribeToViewport(callback: () => void) {
  const media = window.matchMedia(mobileViewportQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getViewportSnapshot() {
  return window.matchMedia(mobileViewportQuery).matches;
}

export function DemoTemplateClient({ template }: { template: TemplateKit }) {
  const isMobileDevice = useSyncExternalStore(subscribeToViewport, getViewportSnapshot, () => false);
  const [manualViewport, setManualViewport] = useState<"desktop" | "mobile" | null>(null);
  const viewport = manualViewport ?? (isMobileDevice ? "mobile" : "desktop");

  return (
    <main className="demo-page-shell">
      <header className="demo-mode-banner">
        <div className="demo-mode-copy" role="status">
          <strong>This is for demo mode</strong>
          <span>Preview template · data tamu dinonaktifkan</span>
        </div>
        <div className="demo-viewport-switch" aria-label="Pilih ukuran viewport">
          <button type="button" className={viewport === "desktop" ? "is-active" : undefined} aria-pressed={viewport === "desktop"} onClick={() => setManualViewport("desktop")}><Monitor size={15} /><span>Desktop</span></button>
          <button type="button" className={viewport === "mobile" ? "is-active" : undefined} aria-pressed={viewport === "mobile"} onClick={() => setManualViewport("mobile")}><Smartphone size={15} /><span>Mobile</span></button>
        </div>
      </header>

      <section className={`demo-preview-canvas is-${viewport}`}>
        <div className="demo-viewport-frame">
          <div className="demo-frame-chrome" aria-hidden="true"><i /><i /><i /><span>{viewport === "desktop" ? "Desktop viewport" : "Mobile viewport · 390px"}</span></div>
          <div className="demo-template-stage">
            <iframe title={`Demo ${template.name} · ${viewport}`} src={`/template-preview?template=${encodeURIComponent(template.code)}`} />
          </div>
        </div>
      </section>
    </main>
  );
}
