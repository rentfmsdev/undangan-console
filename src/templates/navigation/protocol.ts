export const EDITOR_MESSAGE_SOURCE = "undangan-console" as const;
export const PREVIEW_MESSAGE_SOURCE = "undangan-preview" as const;

export type NavigationSource = "editor-sidebar" | "preview-navbar" | "preview-click";

export type EditorToPreviewMessage =
  | { source: typeof EDITOR_MESSAGE_SOURCE; type: "preview-state"; sections: unknown[]; themeId: string; settings: Record<string, unknown> }
  | { source: typeof EDITOR_MESSAGE_SOURCE; type: "navigate-section"; sectionType: string; requestId: string; navigationSource: NavigationSource };

export type PreviewToEditorMessage =
  | { source: typeof PREVIEW_MESSAGE_SOURCE; type: "ready" }
  | { source: typeof PREVIEW_MESSAGE_SOURCE; type: "state-applied" }
  | { source: typeof PREVIEW_MESSAGE_SOURCE; type: "navigation-start" | "navigation-complete" | "navigation-cancelled"; sectionType: string; requestId: string }
  | { source: typeof PREVIEW_MESSAGE_SOURCE; type: "active-section" | "section-selected"; sectionType: string };

export function isEditorMessage(value: unknown): value is EditorToPreviewMessage {
  return Boolean(value && typeof value === "object" && (value as { source?: string }).source === EDITOR_MESSAGE_SOURCE);
}

export function isPreviewMessage(value: unknown): value is PreviewToEditorMessage {
  return Boolean(value && typeof value === "object" && (value as { source?: string }).source === PREVIEW_MESSAGE_SOURCE);
}
