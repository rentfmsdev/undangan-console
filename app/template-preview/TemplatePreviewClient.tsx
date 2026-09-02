"use client";

import { useEffect, useMemo, useState } from "react";
import { getTemplateRuntime, type RuntimeState } from "@/templates/runtime-registry";
import { TEMPLATE_ACTIVE_EVENT, TEMPLATE_NAVIGATE_EVENT, TEMPLATE_NAVIGATION_EVENT } from "@/templates/navigation/TemplateNavigationRuntime";
import { PREVIEW_MESSAGE_SOURCE, isEditorMessage, type PreviewToEditorMessage } from "@/templates/navigation/protocol";

type NavigationDebug = { active: string; status: string; requestId: string; scrollTop: number };
type PreviewMessagePayload = PreviewToEditorMessage extends infer Message ? Message extends { source: string } ? Omit<Message, "source"> : never : never;

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

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || !isEditorMessage(event.data)) return;
      if (event.data.type === "preview-state") {
        currentState = { sections: event.data.sections, themeId: event.data.themeId || "maroon-gold", settings: event.data.settings };
        runtime.applyState(currentState);
        stopWatching();
        stopWatching = runtime.watchState(currentState);
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

    window.addEventListener("message", handleMessage);
    window.addEventListener(TEMPLATE_ACTIVE_EVENT, handleActiveSection);
    window.addEventListener(TEMPLATE_NAVIGATION_EVENT, handleNavigationEvent);
    document.addEventListener("click", handleTemplateClick, true);

    let readyFrame = 0;
    const announceReady = () => {
      const hydratedRoot = document.querySelector<HTMLElement>("[data-template-scroll-root][data-template-hydrated='true']");
      if (!hydratedRoot) {
        readyFrame = window.requestAnimationFrame(announceReady);
        return;
      }
      readyFrame = window.requestAnimationFrame(() => postToEditor({ type: "ready" }));
    };
    readyFrame = window.requestAnimationFrame(announceReady);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener(TEMPLATE_ACTIVE_EVENT, handleActiveSection);
      window.removeEventListener(TEMPLATE_NAVIGATION_EVENT, handleNavigationEvent);
      document.removeEventListener("click", handleTemplateClick, true);
      window.cancelAnimationFrame(debugFrame);
      window.cancelAnimationFrame(readyFrame);
      stopWatching();
    };
  }, [runtime]);

  return <>
    <Renderer />
    {debugEnabled && <output className="navigation-debug" aria-live="polite"><b>Navigation debug</b><span>Active: {debug.active}</span><span>Status: {debug.status}</span><span>Scroll: {Math.round(debug.scrollTop)}</span><span>Request: {debug.requestId.slice(0, 12)}</span></output>}
  </>;
}
