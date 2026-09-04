"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { EditableTextStyle } from "../EditableField";

export type CollaborativeContextValue = {
  isViewer: boolean;
  disabled: boolean;
  updateField: (sectionId: string, key: string, value: unknown) => void;
  updateFields: (sectionId: string, values: Record<string, unknown>) => void;
  updateTextStyle: (sectionId: string, key: string, style: Partial<EditableTextStyle>, replace?: boolean) => void;
  updateGlobalSetting: (key: "themeId" | "musicUrl" | "musicVolume" | "customColors" | "useContainer", value: unknown) => void;
  toggleSection: (sectionId: string) => void;
  activeFieldCollaborator?: (sectionId: string, fieldKey: string) => { name: string; color: string } | null;
  broadcastFieldFocus?: (sectionId: string, fieldKey: string | null) => void;
};

const CollaborativeContext = createContext<CollaborativeContextValue | null>(null);

export function CollaborativeProvider({
  value,
  children,
}: {
  value: CollaborativeContextValue;
  children: ReactNode;
}) {
  return (
    <CollaborativeContext.Provider value={value}>
      {children}
    </CollaborativeContext.Provider>
  );
}

export function useCollaborative() {
  const context = useContext(CollaborativeContext);
  if (!context) {
    throw new Error("useCollaborative must be used within a CollaborativeProvider");
  }
  return context;
}
