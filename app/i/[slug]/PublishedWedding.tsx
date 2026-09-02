"use client";

import { useEffect } from "react";
import { getTemplateRuntime, type NormalizedTemplateSection } from "@/templates/runtime-registry";

export function PublishedWedding({
  templateCode,
  sections,
  themeId,
  invitationId,
  settings,
  verifiedGuestName,
}: {
  templateCode: string;
  sections: NormalizedTemplateSection[];
  themeId: string;
  invitationId: string;
  settings: Record<string, unknown>;
  verifiedGuestName?: string;
}) {
  const runtime = getTemplateRuntime(templateCode);
  const Renderer = runtime.Renderer;

  useEffect(() => {
    let frame = 0;
    let stopWatching = () => {};
    const applyWhenHydrated = () => {
      const root = document.querySelector<HTMLElement>("[data-template-scroll-root][data-template-hydrated='true']");
      if (!root) {
        frame = window.requestAnimationFrame(applyWhenHydrated);
        return;
      }
      runtime.applyState({ sections, themeId, settings });
      stopWatching = runtime.watchState({ sections, themeId, settings });
    };
    frame = window.requestAnimationFrame(applyWhenHydrated);
    return () => {
      window.cancelAnimationFrame(frame);
      stopWatching();
    };
  }, [runtime, sections, themeId, settings]);

  return <Renderer invitationId={invitationId} verifiedGuestName={verifiedGuestName} />;
}
