import * as Y from "yjs";

export type SharedGlobalSettings = {
  themeId: string;
  musicUrl: string;
  musicVolume: number;
  customColors: { primary?: string; accent?: string; background?: string };
};

export type SharedSectionRecord = {
  id: string;
  type: string;
  enabled: boolean;
  order?: number;
  data: Record<string, unknown>;
  textStyles?: Record<string, unknown>;
};

export type SharedDraftState = {
  metadata: {
    templateId: string;
    schemaVersion: number;
    updatedAt: number;
  };
  globalSettings: SharedGlobalSettings;
  sectionOrder: string[];
  sections: Record<string, SharedSectionRecord>;
};

/**
 * Initializes or updates a Y.Doc from plain JSON state.
 */
export function initYDocFromState(state: SharedDraftState, doc: Y.Doc = new Y.Doc()): Y.Doc {
  doc.transact(() => {
    // 1. Metadata
    const metadataMap = doc.getMap("metadata");
    metadataMap.set("templateId", state.metadata?.templateId ?? "hjydg");
    metadataMap.set("schemaVersion", state.metadata?.schemaVersion ?? 1);
    metadataMap.set("updatedAt", state.metadata?.updatedAt ?? Date.now());

    // 2. Global Settings
    const globalSettingsMap = doc.getMap("globalSettings");
    globalSettingsMap.set("themeId", state.globalSettings?.themeId ?? "royal-blue-gold");
    globalSettingsMap.set("musicUrl", state.globalSettings?.musicUrl ?? "/assets/audio/easy-on-me.webm");
    globalSettingsMap.set("musicVolume", state.globalSettings?.musicVolume ?? 0.6);

    const customColorsMap = new Y.Map();
    if (state.globalSettings?.customColors) {
      Object.entries(state.globalSettings.customColors).forEach(([k, v]) => {
        if (v !== undefined) customColorsMap.set(k, v);
      });
    }
    globalSettingsMap.set("customColors", customColorsMap);

    // 3. Section Order
    const sectionOrderArray = doc.getArray<string>("sectionOrder");
    sectionOrderArray.delete(0, sectionOrderArray.length);
    if (Array.isArray(state.sectionOrder)) {
      sectionOrderArray.push(state.sectionOrder);
    }

    // 4. Sections Map
    const sectionsMap = doc.getMap("sections");
    if (state.sections) {
      Object.entries(state.sections).forEach(([id, sec]) => {
        const secMap = new Y.Map();
        secMap.set("id", sec.id);
        secMap.set("type", sec.type);
        secMap.set("enabled", sec.enabled);

        const dataMap = new Y.Map();
        if (sec.data) {
          Object.entries(sec.data).forEach(([k, v]) => {
            dataMap.set(k, v);
          });
        }
        secMap.set("data", dataMap);

        const stylesMap = new Y.Map();
        if (sec.textStyles) {
          Object.entries(sec.textStyles).forEach(([k, v]) => {
            stylesMap.set(k, v);
          });
        }
        secMap.set("textStyles", stylesMap);

        sectionsMap.set(id, secMap);
      });
    }
  });

  return doc;
}

/**
 * Extracts plain JSON state from a Y.Doc.
 */
export function extractStateFromYDoc(doc: Y.Doc): SharedDraftState {
  const metadataMap = doc.getMap("metadata");
  const globalSettingsMap = doc.getMap("globalSettings");
  const sectionOrderArray = doc.getArray<string>("sectionOrder");
  const sectionsMap = doc.getMap("sections");

  const customColorsMap = globalSettingsMap.get("customColors") as Y.Map<string> | undefined;
  const customColors: Record<string, string> = {};
  if (customColorsMap instanceof Y.Map) {
    customColorsMap.forEach((v, k) => {
      customColors[k] = v;
    });
  }

  const sections: Record<string, SharedSectionRecord> = {};
  sectionsMap.forEach((val, key) => {
    if (val instanceof Y.Map) {
      const dataMap = val.get("data") as Y.Map<unknown> | undefined;
      const data: Record<string, unknown> = {};
      if (dataMap instanceof Y.Map) {
        dataMap.forEach((v, k) => {
          data[k] = v;
        });
      }

      const stylesMap = val.get("textStyles") as Y.Map<unknown> | undefined;
      const textStyles: Record<string, unknown> = {};
      if (stylesMap instanceof Y.Map) {
        stylesMap.forEach((v, k) => {
          textStyles[k] = v;
        });
      }

      sections[key] = {
        id: (val.get("id") as string) || key,
        type: (val.get("type") as string) || "",
        enabled: Boolean(val.get("enabled")),
        data,
        textStyles,
      };
    }
  });

  return {
    metadata: {
      templateId: (metadataMap.get("templateId") as string) || "hjydg",
      schemaVersion: Number(metadataMap.get("schemaVersion") || 1),
      updatedAt: Number(metadataMap.get("updatedAt") || Date.now()),
    },
    globalSettings: {
      themeId: (globalSettingsMap.get("themeId") as string) || "royal-blue-gold",
      musicUrl: (globalSettingsMap.get("musicUrl") as string) || "/assets/audio/easy-on-me.webm",
      musicVolume: Number(globalSettingsMap.get("musicVolume") ?? 0.6),
      customColors,
    },
    sectionOrder: sectionOrderArray.toArray(),
    sections,
  };
}
