"use client";

import { useEffect, useMemo, useState } from "react";
import { getTemplateRuntime, type RuntimeState } from "@/templates/runtime-registry";
import { TEMPLATE_ACTIVE_EVENT, TEMPLATE_NAVIGATE_EVENT, TEMPLATE_NAVIGATION_EVENT } from "@/templates/navigation/TemplateNavigationRuntime";
import { PREVIEW_MESSAGE_SOURCE, isEditorMessage, type PreviewToEditorMessage } from "@/templates/navigation/protocol";

type NavigationDebug = { active: string; status: string; requestId: string; scrollTop: number };
type PreviewMessagePayload = PreviewToEditorMessage extends infer Message ? Message extends { source: string } ? Omit<Message, "source"> : never : never;

const SECTION_NAME_MAP: Record<string, string> = {
  "opening-envelope": "Amplop Pembuka",
  envelope: "Amplop Pembuka",
  hero: "Hero / Sampul Utama",
  profile: "Profil Mempelai",
  couple: "Mempelai Pria & Wanita",
  event: "Rangkaian Acara",
  gallery: "Galeri Foto",
  story: "Kisah Cinta",
  gift: "Tanda Kasih / Amplop Digital",
  wishes: "Ucapan & Doa Restu",
  prayer: "Doa & Ayat Suci",
  closing: "Salam Penutup",
  protocol: "Protokol Kesehatan",
};

function formatSectionLabel(type: string): string {
  if (SECTION_NAME_MAP[type]) return SECTION_NAME_MAP[type];
  return type.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TemplatePreviewClient({ templateCode }: { templateCode: string }) {
  const runtime = useMemo(() => getTemplateRuntime(templateCode), [templateCode]);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debug, setDebug] = useState<NavigationDebug>({ active: "-", status: "idle", requestId: "-", scrollTop: 0 });
  const Renderer = runtime.Renderer;

  useEffect(() => {
    let currentState: RuntimeState = { sections: [], themeId: "maroon-gold", settings: {} };
    let stopWatching = () => {};
    const adapter = runtime.createNavigationAdapter();
    const debugFrame = window.requestAnimationFrame(() => setDebugEnabled(new URLSearchParams(window.location.search).get("debugNavigation") === "1"));

    const postToEditor = (message: PreviewMessagePayload) => window.parent.postMessage({ source: PREVIEW_MESSAGE_SOURCE, ...message }, "*");

    const tagAllSections = () => {
      document.querySelectorAll<HTMLElement>("[data-template-section]").forEach((el) => {
        const type = el.dataset.templateSection;
        if (type && !el.getAttribute("data-section-label")) {
          el.setAttribute("data-section-label", formatSectionLabel(type));
        }
      });
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || !isEditorMessage(event.data)) return;
      if (event.data.type === "preview-state") {
        currentState = { sections: event.data.sections, themeId: event.data.themeId || "maroon-gold", settings: event.data.settings };
        runtime.applyState(currentState);
        stopWatching();
        stopWatching = runtime.watchState(currentState);
        tagAllSections();
        postToEditor({ type: "state-applied" });
      }
      if (event.data.type === "navigate-section") {
        window.dispatchEvent(new CustomEvent(TEMPLATE_NAVIGATE_EVENT, { detail: { sectionId: event.data.sectionType, requestId: event.data.requestId, source: event.data.navigationSource } }));
      }
    };

    const handleActiveSection = (event: Event) => {
      const detail = (event as CustomEvent<{ sectionType?: string; scrollTop?: number }>).detail;
      if (!detail?.sectionType) return;
      postToEditor({ type: "active-section", sectionType: detail.sectionType });
      setDebug((state) => ({ ...state, active: detail.sectionType ?? state.active, scrollTop: detail.scrollTop ?? 0 }));
    };

    const handleNavigationEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: "navigation-start" | "navigation-complete" | "navigation-cancelled"; sectionType?: string; requestId?: string; scrollTop?: number }>).detail;
      if (!detail?.type || !detail.sectionType || !detail.requestId) return;
      postToEditor({ type: detail.type, sectionType: detail.sectionType, requestId: detail.requestId });
      setDebug({ active: detail.sectionType, status: detail.type, requestId: detail.requestId, scrollTop: detail.scrollTop ?? 0 });
    };

    const handleTemplateClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const sectionType = target.closest<HTMLElement>("[data-template-section]")?.dataset.templateSection;
      if (sectionType) postToEditor({ type: "section-selected", sectionType });
    };

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const section = target.closest<HTMLElement>("[data-template-section]");
      if (section && !section.getAttribute("data-section-label")) {
        const type = section.dataset.templateSection;
        if (type) section.setAttribute("data-section-label", formatSectionLabel(type));
      }
    };

    let lastPointerTime = 0;
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const now = Date.now();
      if (now - lastPointerTime < 45) return;
      lastPointerTime = now;
      postToEditor({
        type: "preview-pointer" as any,
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("message", handleMessage);
    window.addEventListener(TEMPLATE_ACTIVE_EVENT, handleActiveSection);
    window.addEventListener(TEMPLATE_NAVIGATION_EVENT, handleNavigationEvent);
    document.addEventListener("click", handleTemplateClick, true);
    document.addEventListener("mouseover", handleMouseOver, { passive: true });

    let readyFrame = 0;
    const announceReady = () => {
      const hydratedRoot = document.querySelector<HTMLElement>("[data-template-scroll-root][data-template-hydrated='true']");
      if (!hydratedRoot) {
        readyFrame = window.requestAnimationFrame(announceReady);
        return;
      }
      tagAllSections();
      readyFrame = window.requestAnimationFrame(() => postToEditor({ type: "ready" }));
    };
    readyFrame = window.requestAnimationFrame(announceReady);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("message", handleMessage);
      window.removeEventListener(TEMPLATE_ACTIVE_EVENT, handleActiveSection);
      window.removeEventListener(TEMPLATE_NAVIGATION_EVENT, handleNavigationEvent);
      document.removeEventListener("click", handleTemplateClick, true);
      document.removeEventListener("mouseover", handleMouseOver);
      window.cancelAnimationFrame(debugFrame);
      window.cancelAnimationFrame(readyFrame);
      stopWatching();
    };
  }, [runtime]);

  return (
    <>
      <style>{`
        /* Figma Section Interactive Hover Bounding Box */
        [data-template-section] {
          position: relative !important;
          transition: outline 0.15s ease, outline-offset 0.15s ease !important;
          cursor: pointer;
        }
        [data-template-section]:hover {
          outline: 2px solid #10b981 !important;
          outline-offset: -2px !important;
        }
        [data-template-section]:hover::after {
          content: attr(data-section-label);
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 999999;
          display: inline-flex;
          align-items: center;
          background: #10b981;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 10.5px;
          font-weight: 700;
          line-height: 1;
          padding: 4px 10px;
          border-radius: 6px;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4), 0 2px 4px rgba(0, 0, 0, 0.12);
          pointer-events: none;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          animation: figmaSectionBadgePop 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes figmaSectionBadgePop {
          0% {
            opacity: 0;
            transform: translateY(-3px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <Renderer />
      {debugEnabled && (
        <output className="navigation-debug" aria-live="polite">
          <b>Navigation debug</b>
          <span>Active: {debug.active}</span>
          <span>Status: {debug.status}</span>
          <span>Scroll: {Math.round(debug.scrollTop)}</span>
          <span>Request: {debug.requestId.slice(0, 12)}</span>
        </output>
      )}
    </>
  );
}
