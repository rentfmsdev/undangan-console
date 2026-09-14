"use client";

import { useEffect, useRef } from "react";
import { trackMetaPixel } from "@/lib/meta-pixel";
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
  const trackedInvitationId = useRef<string | null>(null);

  useEffect(() => {
    if (trackedInvitationId.current === invitationId) return;

    trackMetaPixel("ViewContent", {
      content_category: "invitation",
      content_id: invitationId,
      content_name: templateCode,
    });
    trackedInvitationId.current = invitationId;
  }, [invitationId, templateCode]);

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
