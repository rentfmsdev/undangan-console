"use client";

import { useEffect } from "react";
import type { TemplateNavigationAdapter } from "./contracts";
import { PreviewNavigationManager } from "./preview-navigation-manager";
import type { NavigationSource } from "./protocol";

export const TEMPLATE_NAVIGATE_EVENT = "template:navigate";
export const TEMPLATE_ACTIVE_EVENT = "template:active-section";
export const TEMPLATE_NAVIGATION_EVENT = "template:navigation-event";

export function TemplateNavigationRuntime({ createAdapter }: { createAdapter: () => TemplateNavigationAdapter }) {
  useEffect(() => {
    const adapter = createAdapter();
    const manager = new PreviewNavigationManager({
      adapter,
      onActiveSection: (sectionType) => window.dispatchEvent(new CustomEvent(TEMPLATE_ACTIVE_EVENT, { detail: { sectionType, scrollTop: adapter.getScrollRoot()?.scrollTop ?? 0 } })),
      onNavigationEvent: (type, sectionType, requestId) => window.dispatchEvent(new CustomEvent(TEMPLATE_NAVIGATION_EVENT, { detail: { type, sectionType, requestId, scrollTop: adapter.getScrollRoot()?.scrollTop ?? 0 } })),
    });

    const handleNavigate = (event: Event) => {
      const detail = (event as CustomEvent<{ sectionId?: string; requestId?: string; source?: NavigationSource }>).detail;
      if (!detail?.sectionId) return;
      void manager.navigate(detail.sectionId, detail.requestId ?? crypto.randomUUID(), detail.source ?? "preview-navbar");
    };

    manager.start();
    window.addEventListener(TEMPLATE_NAVIGATE_EVENT, handleNavigate);
    return () => {
      manager.destroy();
      window.removeEventListener(TEMPLATE_NAVIGATE_EVENT, handleNavigate);
    };
  }, [createAdapter]);

  return null;
}
