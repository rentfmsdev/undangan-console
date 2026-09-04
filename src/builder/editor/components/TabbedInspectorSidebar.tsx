"use client";

import { Palette, SlidersHorizontal } from "lucide-react";
import { useId, useRef, useState, type ReactNode, type KeyboardEvent } from "react";

export type InspectorSidebarTab = "section" | "global";

type Props = {
  /** Existing action controls, e.g. undo, redo, assets, version history, and save. */
  toolbar: ReactNode;
  /** Existing contextual editor for the currently selected invitation section. */
  sectionContent: ReactNode;
  /** Existing invitation-wide settings such as theme, colours, and music. */
  globalContent: ReactNode;
  /** Use this when the parent needs to coordinate the active tab with another UI event. */
  activeTab?: InspectorSidebarTab;
  defaultTab?: InspectorSidebarTab;
  onTabChange?: (tab: InspectorSidebarTab) => void;
  className?: string;
};

export function TabbedInspectorSidebar({
  toolbar,
  sectionContent,
  globalContent,
  activeTab,
  defaultTab = "section",
  onTabChange,
  className = "",
}: Props) {
  const [uncontrolledTab, setUncontrolledTab] = useState<InspectorSidebarTab>(defaultTab);
  const selectedTab = activeTab ?? uncontrolledTab;
  const sectionPanelId = useId();
  const globalPanelId = useId();
  const tablistRef = useRef<HTMLDivElement>(null);

  function selectTab(tab: InspectorSidebarTab) {
    if (activeTab === undefined) setUncontrolledTab(tab);
    onTabChange?.(tab);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, currentTab: InspectorSidebarTab) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const nextTab: InspectorSidebarTab = currentTab === "section" ? "global" : "section";
      selectTab(nextTab);
      const nextBtn = tablistRef.current?.querySelector<HTMLButtonElement>(
        nextTab === "section" ? `#${sectionPanelId}-tab` : `#${globalPanelId}-tab`
      );
      nextBtn?.focus();
    }
  }

  const tabs: Array<{ id: InspectorSidebarTab; label: string; icon: ReactNode; panelId: string }> = [
    { id: "section", label: "Section", icon: <SlidersHorizontal size={13} />, panelId: sectionPanelId },
    { id: "global", label: "Global", icon: <Palette size={13} />, panelId: globalPanelId },
  ];

  return (
    <div className={`min-w-0 ${className}`}>
      {/* Sticky Header with Toolbar & Segmented Tabs */}
      <div className="sticky top-0 z-30 space-y-2 bg-slate-50 pb-2.5">
        {toolbar}
        {/* Navigation Tabs matching header styling */}
        <div
          ref={tablistRef}
          role="tablist"
          aria-label="Mode pengaturan editor"
          className="grid grid-cols-2 rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 shadow-xs"
        >
          {tabs.map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`${tab.panelId}-tab`}
                type="button"
                role="tab"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                aria-controls={tab.panelId}
                onClick={() => selectTab(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, tab.id)}
                className={`ui-interactive inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <span className={`shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400"}`}>{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels with explicit block/hidden display */}
      <div
        id={sectionPanelId}
        role="tabpanel"
        aria-labelledby={`${sectionPanelId}-tab`}
        className={`min-w-0 ${selectedTab === "section" ? "block" : "hidden"}`}
      >
        {sectionContent}
      </div>

      <div
        id={globalPanelId}
        role="tabpanel"
        aria-labelledby={`${globalPanelId}-tab`}
        className={`min-w-0 ${selectedTab === "global" ? "block" : "hidden"}`}
      >
        {globalContent}
      </div>
    </div>
  );
}
