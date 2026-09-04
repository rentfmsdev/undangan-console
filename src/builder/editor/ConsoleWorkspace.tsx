"use client";

import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, ChevronDown, Copy, ExternalLink, Eye, FolderOpen, GripVertical, ImagePlus, LayoutPanelTop, Library, LoaderCircle, Maximize2, MessageCircleHeart, MessageSquare, Monitor, Music2, Palette, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Plus, Redo2, RotateCw, Save, Search, Send, Settings2, Share2, Shield, Smartphone, Sparkles, Type, Undo2, Upload, UserPlus, Users, WifiOff, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { TemplateKit, TemplateSection } from "@/templates/contracts";
import { getTemplateRuntime } from "@/templates/runtime-registry";
import { EDITOR_MESSAGE_SOURCE, isPreviewMessage, type NavigationSource } from "@/templates/navigation/protocol";
import Link from "next/link";
import Image from "next/image";
import { EditableField, type EditableTextStyle } from "./components/EditableField";
import { GoogleLoginModal } from "@/components/auth/GoogleLoginModal";
import { UserAuthDropdown } from "@/components/auth/UserAuthDropdown";
import { AssetUploadField } from "./components/AssetUploadField";
import { AssetLibraryModal, type UserAsset } from "./components/AssetLibraryModal";
import { MyInvitationsModal } from "@/components/invitations/MyInvitationsModal";
import { MusicSelectorField } from "./components/MusicSelectorField";
import { stockMusicLibrary, getDefaultStockMusic } from "@/config/stock-music";
import { makeAdminWhatsAppUrl } from "@/config/contact";
import { PublishModal, type PublishResult } from "./components/PublishModal";
import { buildInvitationUrl, getAppBaseUrl } from "@/lib/app-url";
import { useAutoSave } from "./hooks/useAutoSave";
import { AutoSaveStatusBadge } from "./components/AutoSaveStatusBadge";
import { BulkGuestManager } from "./components/BulkGuestManager";
import { InviteCollaboratorModal } from "./components/InviteCollaboratorModal";
import { usePresence } from "@/modules/collaboration/client/usePresence";
import { CollaboratorAvatarStack } from "./collaboration/CollaboratorAvatarStack";
import { CollaborationStatus } from "./collaboration/CollaborationStatus";
import { RemoteCursorLayer } from "./collaboration/RemoteCursorLayer";
import { CollaboratorSectionBadge } from "./collaboration/CollaboratorSectionBadge";
import { CollaborationPresence } from "@/modules/collaboration/domain/presence";
import { useCollaborationDocument } from "@/modules/collaboration/client/useCollaborationDocument";
import { SharedDraftState } from "@/modules/collaboration/domain/crdt-mapper";
import { CollaborativeProvider, type CollaborativeContextValue } from "./components/collaborative/CollaborativeContext";
import { CollaborativeGlobalEditor } from "./components/collaborative/CollaborativeGlobalEditor";
import { CollaborativeSectionInspector } from "./components/collaborative/CollaborativeSectionInspector";
import { compressImage } from "@/lib/image-compressor";
import * as Y from "yjs";

type View = "editor" | "generator" | "wishes";
export type EditableSection = TemplateSection & { id: string; enabled: boolean };
type WishRecord = { id: string; name: string; attendance: string; message: string; createdAt: string };
type ClientUser = { id: string; email: string; name: string; avatarUrl: string | null; role: "user" | "admin" };
type LocalDraftSnapshot = { version: 1; themeId: string; musicUrl: string; musicVolume?: number; customColors?: { primary?: string; accent?: string; background?: string }; sections: Array<{ id: string; type: string; enabled: boolean; data: Record<string, unknown> }> };
type PendingNavigation = { sectionType: string; requestId: string; navigationSource: NavigationSource };
type AssetTarget = { kind: "image" | "audio"; target: "content" | "background" | "music" | "manager"; sectionId: string | null };

function makeSections(template: TemplateKit): EditableSection[] {
  return template.defaultSections.flatMap((type, index) => {
    const section = template.sections.find((item) => item.type === type);
    return section ? [{ ...section, id: `${section.type}-${index + 1}`, enabled: true, defaultData: { ...section.defaultData } }] : [];
  });
}

function hydrateSections(template: TemplateKit, records: Array<{ id: string; type: string; enabled: boolean; data: Record<string, unknown> }>) {
  return getTemplateRuntime(template.code).normalizeSections(template, records, () => crypto.randomUUID()).flatMap((record) => {
    const section = template.sections.find((item) => item.type === record.type);
    return section ? [{ ...section, id: record.id, enabled: record.enabled, defaultData: { ...section.defaultData, ...record.data } }] : [];
  });
}

function SortableSectionRow({
  section,
  active,
  onSelect,
  onToggle,
  onlineUsers = [],
  currentUserId,
}: {
  section: EditableSection;
  active: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onlineUsers?: CollaborationPresence[];
  currentUserId?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id, disabled: !section.reorderable });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} data-section-id={section.id} style={style} className={`group flex items-center gap-2 rounded-xl border px-2.5 py-2 transition ${active ? "border-emerald-600 bg-emerald-50/70 shadow-sm" : "border-transparent hover:bg-[#f6f0e8]"} ${isDragging ? "z-30 opacity-55 shadow-lg" : ""}`}>
      <button type="button" className={`grid h-7 w-5 place-items-center ${section.reorderable ? "cursor-grab text-[#a49488] active:cursor-grabbing" : "cursor-not-allowed text-[#d5c8bd]"}`} aria-label={`Geser ${section.label}`} disabled={!section.reorderable} {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left flex items-center justify-between gap-1.5">
        <div className="min-w-0">
          <span className="block truncate text-xs font-bold text-[#473234]">{section.label}</span>
          <span className="block truncate text-[10px] text-[#95827a]">{section.required ? "Wajib" : "Opsional"}</span>
        </div>
        <CollaboratorSectionBadge sectionId={section.id} onlineUsers={onlineUsers} currentUserId={currentUserId} />
      </button>
      <button type="button" onClick={onToggle} className={`h-5 w-9 rounded-full p-0.5 transition ${section.enabled ? "bg-emerald-600" : "bg-[#ded5cc]"}`} aria-label={`${section.enabled ? "Sembunyikan" : "Tampilkan"} ${section.label}`}>
        <span className={`block h-4 w-4 rounded-full bg-white shadow transition ${section.enabled ? "translate-x-4" : ""}`} />
      </button>
    </div>
  );
}

function SidebarAccordion({ title, subtitle, icon, open, onToggle, children }: { title: string; subtitle: string; icon: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,.05)]">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50" aria-expanded={open}>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${open ? "bg-emerald-600 text-white shadow-sm" : "bg-emerald-50 text-emerald-600"}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <strong className="block text-xs font-extrabold uppercase tracking-[.12em] text-slate-800">{title}</strong>
          <small className="mt-0.5 block truncate text-[10px] font-medium text-slate-500">{subtitle}</small>
        </span>
        <ChevronDown size={17} className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-100 p-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

type HistorySnapshot = {
  sections: EditableSection[];
  themeId: string;
  musicUrl: string;
  musicVolume?: number;
  customColors?: { primary?: string; accent?: string; background?: string };
};

export function ConsoleWorkspace({
  template,
  templatePrice,
  requestedDraftId = null,
  isOwner = true,
  userRole = "owner",
}: {
  template: TemplateKit;
  templatePrice: number;
  requestedDraftId?: string | null;
  isOwner?: boolean;
  userRole?: string | null;
}) {
  const [liveCollaborationRole, setLiveCollaborationRole] = useState(userRole);
  const isViewer = liveCollaborationRole === "viewer";
  const [view, setView] = useState<View>("editor");
  const [sections, setSections] = useState<EditableSection[]>(() => makeSections(template));
  const [selectedId, setSelectedId] = useState(sections[0]?.id ?? "");
  const [themeId, setThemeId] = useState(template.themes[0].id);
  const [musicUrl, setMusicUrl] = useState(() => getDefaultStockMusic(template.category).url);
  const [musicVolume, setMusicVolume] = useState<number>(0.6);
  const [customThemeColors, setCustomThemeColors] = useState<{ primary?: string; accent?: string; background?: string }>({});
  const [isPublished, setIsPublished] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"draft" | "published" | "custom">("draft");
  const [publishNotice, setPublishNotice] = useState<{ tone: "success" | "custom"; message: string } | null>(null);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [publishMode, setPublishMode] = useState<"path" | "subdomain">("path");
  const [publishIdentifier, setPublishIdentifier] = useState("ayuardi");
  const [publishUrl, setPublishUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [inspectorWidth, setInspectorWidth] = useState(340);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [isStructureCollapsed, setIsStructureCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnectedBadge, setShowReconnectedBadge] = useState(false);
  const [isInspectorResizing, setIsInspectorResizing] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [frameMode, setFrameMode] = useState<"desktop" | "ios" | "android" | "clean">("ios");
  const [globalEditorOpen, setGlobalEditorOpen] = useState(true);
  const [sectionEditorOpen, setSectionEditorOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginReason, setLoginReason] = useState("Masuk dengan Google untuk menyimpan perubahan dan mengelola undangan Anda.");
  const [assetTarget, setAssetTarget] = useState<AssetTarget | null>(null);
  const [isMyInvitationsOpen, setIsMyInvitationsOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [wishRecords, setWishRecords] = useState<WishRecord[]>([]);
  const [wishesLoading, setWishesLoading] = useState(true);

  const [sectionSearchQuery, setSectionSearchQuery] = useState("");
  const [waPreset, setWaPreset] = useState<"formal" | "islami" | "casual" | "english">("formal");

  const applySharedState = useCallback((remoteState: SharedDraftState) => {
    if (remoteState.globalSettings?.themeId) {
      setThemeId(remoteState.globalSettings.themeId);
    }
    if (typeof remoteState.globalSettings?.musicUrl === "string") {
      setMusicUrl(remoteState.globalSettings.musicUrl);
    }
    if (typeof remoteState.globalSettings?.musicVolume === "number") {
      setMusicVolume(remoteState.globalSettings.musicVolume);
    }
    if (remoteState.globalSettings?.customColors) {
      setCustomThemeColors(remoteState.globalSettings.customColors);
    }

    if (remoteState.sections && Object.keys(remoteState.sections).length > 0) {
      setSections(() => {
        const remoteSecMap = remoteState.sections;
        const orderedIds = [
          ...(remoteState.sectionOrder ?? []),
          ...Object.keys(remoteSecMap).filter((id) => !(remoteState.sectionOrder ?? []).includes(id)),
        ];

        // Always normalize the complete remote document through the template
        // contract. Besides keeping new collaborator sections, this migrates
        // old drafts when a template introduces a required default section
        // (for example the opening envelope).
        const records = orderedIds.flatMap((id) => {
          const remote = remoteSecMap[id];
          if (!remote) return [];
          return [{
            id,
            type: remote.type,
            enabled: remote.enabled,
            data: {
              ...remote.data,
              textStyles: remote.textStyles ?? remote.data.textStyles,
            },
          }];
        });
        return hydrateSections(template, records);
      });
    }
  }, [template]);

  const collabDoc = useCollaborationDocument({
    draftId: draftId ?? undefined,
    enabled: Boolean(draftId && currentUser),
    onRemoteStateChange: applySharedState,
  });

  // Persist migrations produced by a template normalizer into the shared
  // document. Without this, an old draft can look correct temporarily but
  // lose newly-required sections again when a collaborator reconnects.
  useEffect(() => {
    if (!draftReady || !currentUser || isViewer) return;
    collabDoc.updateLocalState((doc) => {
      const sectionsMap = doc.getMap("sections");
      const orderArray = doc.getArray<string>("sectionOrder");
      // Wait for the initial server/CRDT document. An empty map is a new
      // document and is initialized by the normal draft flow.
      if (!sectionsMap.size) return;
      const existingTypes = new Set(Array.from(sectionsMap.values()).flatMap((value) => value instanceof Y.Map && typeof value.get("type") === "string" ? [value.get("type") as string] : []));
      const additions = template.defaultSections.flatMap((type) => {
        const definition = template.sections.find((section) => section.type === type);
        return definition && !existingTypes.has(type) ? [{ id: crypto.randomUUID(), definition }] : [];
      });
      additions.forEach(({ id, definition }) => {
        const sectionMap = new Y.Map<unknown>();
        sectionMap.set("id", id);
        sectionMap.set("type", definition.type);
        sectionMap.set("enabled", true);
        const dataMap = new Y.Map<unknown>();
        Object.entries(definition.defaultData).forEach(([key, value]) => dataMap.set(key, value));
        sectionMap.set("data", dataMap);
        sectionsMap.set(id, sectionMap);
        orderArray.push([id]);
      });
    });
  }, [collabDoc, currentUser, draftReady, isViewer, sections, template]);

  const canUndo = collabDoc.canUndo;
  const canRedo = collabDoc.canRedo;

  function handleUndo() {
    if (isViewer) return;
    const nextState = collabDoc.undo();
    if (nextState) {
      applySharedState(nextState);
    }
  }

  function handleRedo() {
    if (isViewer) return;
    const nextState = collabDoc.redo();
    if (nextState) {
      applySharedState(nextState);
    }
  }

  const updateGlobalSetting = useCallback((
    key: "themeId" | "musicUrl" | "musicVolume" | "customColors",
    value: unknown
  ) => {
    if (isViewer) return;
    if (key === "themeId") {
      setThemeId(value as string);
      setCustomThemeColors({});
    } else if (key === "musicUrl") {
      setMusicUrl(value as string);
    } else if (key === "musicVolume") {
      setMusicVolume(value as number);
    } else if (key === "customColors") {
      setCustomThemeColors(value as Record<string, string>);
    }

    collabDoc.updateLocalState((doc) => {
      const globalSettings = doc.getMap("globalSettings");
      if (key === "themeId") {
        globalSettings.set("themeId", value as string);
        const customColorsMap = globalSettings.get("customColors");
        if (customColorsMap instanceof Y.Map) {
          Array.from(customColorsMap.keys()).forEach((k) => customColorsMap.delete(k));
        }
      } else if (key === "customColors") {
        let customColorsMap = globalSettings.get("customColors");
        if (!(customColorsMap instanceof Y.Map)) {
          customColorsMap = new Y.Map();
          globalSettings.set("customColors", customColorsMap);
        }
        Array.from((customColorsMap as Y.Map<string>).keys()).forEach((k) =>
          (customColorsMap as Y.Map<string>).delete(k)
        );
        Object.entries((value as Record<string, string>) || {}).forEach(([k, v]) => {
          if (v) (customColorsMap as Y.Map<string>).set(k, v);
        });
      } else {
        globalSettings.set(key, value);
      }
    });
  }, [isViewer, collabDoc]);

  function handleThemeSelect(newThemeId: string) {
    updateGlobalSetting("themeId", newThemeId);
  }

  function handleCustomColorChange(colorKey: "primary" | "accent" | "background", value: string) {
    updateGlobalSetting("customColors", { ...customThemeColors, [colorKey]: value });
  }

  function handleCustomColorReset() {
    updateGlobalSetting("customColors", {});
  }

  function handleMusicUrlChange(url: string) {
    updateGlobalSetting("musicUrl", url);
  }

  function handleMusicVolumeChange(vol: number) {
    updateGlobalSetting("musicVolume", vol);
  }

  const handleSectionToggle = useCallback((sectionId: string) => {
    if (isViewer) return;
    setSections((items) => {
      const next = items.map((sec) => sec.id === sectionId ? { ...sec, enabled: !sec.enabled } : sec);
      const target = next.find((sec) => sec.id === sectionId);
      if (target) {
        collabDoc.updateLocalState((doc) => {
          const sectionsMap = doc.getMap("sections");
          let secMap = sectionsMap.get(sectionId) as Y.Map<unknown> | undefined;
          if (!secMap) {
            secMap = new Y.Map();
            secMap.set("id", target.id);
            secMap.set("type", target.type);
            sectionsMap.set(sectionId, secMap);
          }
          secMap.set("enabled", target.enabled);
        });
      }
      return next;
    });
  }, [isViewer, collabDoc]);

  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const previewReadyRef = useRef(false);
  const previewPanelRef = useRef<HTMLElement>(null);
  const structurePanelRef = useRef<HTMLElement>(null);
  const inspectorPanelRef = useRef<HTMLElement>(null);
  const inspectorWidthRef = useRef(340);
  const inspectorResizeRef = useRef(false);
  const pendingNavigationRef = useRef<PendingNavigation | null>(null);
  const draftInitializationRef = useRef("");
  const musicInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 7 } }));
  const selected = sections.find((section) => section.id === selectedId) ?? sections[0];
  const theme = template.themes.find((item) => item.id === themeId) ?? template.themes[0];
  const previewSections = useMemo(() => sections.map((section) => ({ id: section.id, type: section.type, enabled: section.enabled, data: section.defaultData })), [sections]);
  const previewSettings = useMemo(() => ({ musicUrl, musicVolume, customColors: customThemeColors }), [musicUrl, musicVolume, customThemeColors]);
  const localDraftKey = `undangan-console:local-draft:${template.code}`;

  const filteredSections = useMemo(() => {
    if (!sectionSearchQuery.trim()) return sections;
    const q = sectionSearchQuery.toLowerCase();
    return sections.filter((s) => s.label.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q));
  }, [sections, sectionSearchQuery]);

  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y) for isolated undo/redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, collabDoc, applySharedState]);

  useEffect(() => {
    const savedWidth = Number(window.localStorage.getItem(`undangan-console:inspector-width:${template.code}`));
    if (Number.isFinite(savedWidth) && savedWidth >= 280 && savedWidth <= 620) {
      inspectorWidthRef.current = savedWidth;
      setInspectorWidth(savedWidth);
    }
    const savedCollapsed = window.localStorage.getItem(`undangan-console:inspector-collapsed:${template.code}`);
    if (savedCollapsed === "true") {
      setIsInspectorCollapsed(true);
    } else if (savedCollapsed === "false") {
      setIsInspectorCollapsed(false);
    } else if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsInspectorCollapsed(true);
    }
    const savedStructureCollapsed = window.localStorage.getItem(`undangan-console:structure-collapsed:${template.code}`);
    if (savedStructureCollapsed === "true") {
      setIsStructureCollapsed(true);
    }
  }, [template.code]);

  const toggleInspectorCollapse = useCallback(() => {
    setIsInspectorCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(`undangan-console:inspector-collapsed:${template.code}`, String(next));
      return next;
    });
  }, [template.code]);

  const toggleStructureCollapse = useCallback(() => {
    setIsStructureCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(`undangan-console:structure-collapsed:${template.code}`, String(next));
      return next;
    });
  }, [template.code]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);



  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const panel = structurePanelRef.current;
      const row = Array.from(panel?.querySelectorAll<HTMLElement>("[data-section-id]") ?? []).find((item) => item.dataset.sectionId === selectedId);
      if (panel && row) {
        const panelRect = panel.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        if (rowRect.top < panelRect.top + 12) panel.scrollTop -= panelRect.top + 12 - rowRect.top;
        else if (rowRect.bottom > panelRect.bottom - 12) panel.scrollTop += rowRect.bottom - (panelRect.bottom - 12);
      }
      if (inspectorPanelRef.current) inspectorPanelRef.current.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedId]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => { if (active) setCurrentUser(payload.user ?? null); })
      .catch(() => { if (active) setCurrentUser(null); })
      .finally(() => { if (active) setAuthResolved(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authResolved) return;
    const initializationKey = `${currentUser?.id ?? "anonymous"}:${template.code}:${requestedDraftId ?? "new"}`;
    if (draftInitializationRef.current === initializationKey) return;
    draftInitializationRef.current = initializationKey;
    let active = true;
    setDraftReady(false);

    const readLocalSnapshot = () => {
      try {
        const raw = window.localStorage.getItem(localDraftKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as LocalDraftSnapshot;
        return parsed?.version === 1 && Array.isArray(parsed.sections) ? parsed : null;
      } catch {
        return null;
      }
    };

    const applyState = (nextThemeId: string, nextMusicUrl: string, records: LocalDraftSnapshot["sections"], nextCustomColors?: { primary?: string; accent?: string; background?: string }, nextMusicVolume?: number) => {
      if (!active) return;
      const hydrated = hydrateSections(template, records);
      setThemeId(nextThemeId);
      setMusicUrl(nextMusicUrl);
      setMusicVolume(typeof nextMusicVolume === "number" ? nextMusicVolume : 0.6);
      setCustomThemeColors(nextCustomColors ?? {});
      setSections(hydrated);
      setSelectedId(hydrated[0]?.id ?? "");
      setDraftReady(true);
    };

    async function loadServerDraft(id: string) {
      const response = await fetch(`/api/drafts/${id}`, { cache: "no-store" });
      if (!response.ok) return false;
      const payload = await response.json();
      if (!active) return true;
      setDraftId(id);
      const nextStatus = payload.draft.status === "published" ? "published" : payload.draft.status === "custom" ? "custom" : "draft";
      setDraftStatus(nextStatus);
      setIsPublished(nextStatus === "published");
      const customRequestIdentifier = typeof payload.draft.styleOverrides?.publishRequest?.identifier === "string" ? payload.draft.styleOverrides.publishRequest.identifier : "";
      const savedIdentifier = payload.draft.slug || payload.draft.subdomain || customRequestIdentifier;
      if (savedIdentifier) setPublishIdentifier(savedIdentifier);
      if (nextStatus === "published" && payload.draft.slug) setPublishUrl(buildInvitationUrl(payload.draft.slug));
      if (nextStatus === "custom") {
        setPublishNotice({ tone: "custom", message: customRequestIdentifier ? `Request ${customRequestIdentifier} sedang menunggu proses admin.` : "Request custom sedang menunggu proses admin." });
      } else {
        setPublishNotice(null);
      }
      const savedMusicUrl = typeof payload.draft.styleOverrides?.musicUrl === "string"
        ? payload.draft.styleOverrides.musicUrl
        : getDefaultStockMusic(template.category).url;
      applyState(payload.draft.themeId, savedMusicUrl, payload.sections, payload.draft.styleOverrides?.customColors, payload.draft.styleOverrides?.musicVolume);
      return true;
    }

    async function initializeDraft() {
      const localSnapshot = readLocalSnapshot();
      if (!currentUser) {
        setDraftId(null);
        if (requestedDraftId) {
          requestLogin("Masuk dengan Google untuk membuka dan mengedit draft kolaborasi ini.");
        }
        if (localSnapshot) applyState(localSnapshot.themeId, typeof localSnapshot.musicUrl === "string" ? localSnapshot.musicUrl : "", localSnapshot.sections, localSnapshot.customColors, localSnapshot.musicVolume);
        else setDraftReady(true);
        return;
      }

      const activeDraftKey = `undangan-console:user-draft:${currentUser.id}:${template.code}`;
      if (requestedDraftId && await loadServerDraft(requestedDraftId)) {
        window.localStorage.setItem(activeDraftKey, requestedDraftId);
        return;
      }
      const legacyDraftId = window.localStorage.getItem(`undangan-console:draft:${template.code}`);
      if (legacyDraftId) {
        const claim = await fetch(`/api/drafts/${legacyDraftId}/claim`, { method: "POST" });
        if (claim.ok && await loadServerDraft(legacyDraftId)) {
          window.localStorage.setItem(activeDraftKey, legacyDraftId);
          window.localStorage.removeItem(`undangan-console:draft:${template.code}`);
          return;
        }
      }

      const storedDraftId = window.localStorage.getItem(activeDraftKey);
      if (!localSnapshot && storedDraftId && await loadServerDraft(storedDraftId)) return;

      if (localSnapshot) {
        const created = await fetch("/api/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateCode: template.code, title: `${template.name} - Draft lokal` }) });
        if (!created.ok) return;
        const createdPayload = await created.json();
        const migratedSections = localSnapshot.sections.map((section) => ({ ...section, id: crypto.randomUUID() }));
        await fetch(`/api/drafts/${createdPayload.draftId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ themeId: localSnapshot.themeId, settings: { musicUrl: localSnapshot.musicUrl, musicVolume: localSnapshot.musicVolume, customColors: localSnapshot.customColors }, sections: migratedSections.map((section, order) => ({ ...section, order })) }) });
        window.localStorage.removeItem(localDraftKey);
        window.localStorage.setItem(activeDraftKey, createdPayload.draftId);
        setDraftId(createdPayload.draftId);
        applyState(localSnapshot.themeId, localSnapshot.musicUrl, migratedSections, localSnapshot.customColors, localSnapshot.musicVolume);
        return;
      }

      const listResponse = await fetch(`/api/drafts?templateCode=${encodeURIComponent(template.code)}`, { cache: "no-store" });
      const listPayload = listResponse.ok ? await listResponse.json() : { drafts: [] };
      const latestDraftId = listPayload.drafts?.[0]?.id as string | undefined;
      if (latestDraftId && await loadServerDraft(latestDraftId)) {
        window.localStorage.setItem(activeDraftKey, latestDraftId);
        return;
      }

      const created = await fetch("/api/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateCode: template.code }) });
      if (!created.ok) return;
      const createdPayload = await created.json();
      window.localStorage.setItem(activeDraftKey, createdPayload.draftId);
      await loadServerDraft(createdPayload.draftId);
    }

    void initializeDraft();
    return () => { active = false; };
  }, [authResolved, currentUser, localDraftKey, requestedDraftId, template]);

  useEffect(() => {
    if (!currentUser || !draftId || !draftReady) return;
    const nextPath = `/editor/${template.code}/${draftId}`;
    if (window.location.pathname !== nextPath) window.history.replaceState(window.history.state, "", nextPath);
  }, [currentUser, draftId, draftReady, template.code]);

  const autoSaveData = useMemo(() => ({
    themeId,
    musicUrl,
    musicVolume,
    customColors: customThemeColors,
    sections: sections.map((section) => ({
      id: section.id,
      type: section.type,
      enabled: section.enabled,
      data: section.defaultData,
    })),
  }), [themeId, musicUrl, musicVolume, customThemeColors, sections]);

  const presence = usePresence({
    draftId: draftId ?? undefined,
    enabled: Boolean(draftId && currentUser),
    role: (liveCollaborationRole as "owner" | "editor" | "viewer") || (isOwner ? "owner" : "editor"),
    currentUser: currentUser
      ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatarUrl: currentUser.avatarUrl,
        }
      : null,
    onDocInit: collabDoc.applyRemoteUpdate,
    onDocUpdate: collabDoc.applyRemoteUpdate,
    onPermissionChange: setLiveCollaborationRole,
  });

  useEffect(() => {
    collabDoc.setBroadcastHandler(presence.broadcastDocUpdate);
  }, [presence.broadcastDocUpdate, collabDoc]);

  // Clear legacy upload error when WebSocket connects successfully
  useEffect(() => {
    if (presence.connectionStatus === "connected") {
      setUploadError("");
    }
  }, [presence.connectionStatus]);

  const prevWsStatusRef = useRef(presence.connectionStatus);
  useEffect(() => {
    if (prevWsStatusRef.current === "connecting" && presence.connectionStatus === "connected") {
      setShowReconnectedBadge(true);
      const timer = setTimeout(() => setShowReconnectedBadge(false), 3000);
      return () => clearTimeout(timer);
    }
    prevWsStatusRef.current = presence.connectionStatus;
  }, [presence.connectionStatus]);

  // Legacy HTTP auto-save: acts strictly as a FALLBACK callback when WebSocket is disconnected/offline
  const isWsConnected = presence.connectionStatus === "connected";
  const { status: autoSaveStatus, flush: flushAutoSave } = useAutoSave({
    data: autoSaveData,
    enabled: authResolved && draftReady && !isWsConnected,
    debounceMs: 2500,
    maxWaitMs: 8000,
    onSave: async (dataToSave) => {
      const snapshot: LocalDraftSnapshot = {
        version: 1,
        themeId: dataToSave.themeId,
        musicUrl: dataToSave.musicUrl,
        musicVolume: dataToSave.musicVolume,
        customColors: dataToSave.customColors,
        sections: dataToSave.sections,
      };

      if (!currentUser || !draftId) {
        window.localStorage.setItem(localDraftKey, JSON.stringify(snapshot));
        return;
      }

      setIsSaving(true);
      try {
        const response = await fetch(`/api/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            themeId: dataToSave.themeId,
            settings: {
              musicUrl: dataToSave.musicUrl,
              musicVolume: dataToSave.musicVolume,
              customColors: dataToSave.customColors,
            },
            sections: dataToSave.sections.map((section, order) => ({ ...section, order })),
          }),
        });

        if (!response.ok) {
          throw new Error("Gagal menyimpan ke server");
        }
        setUploadError("");
      } finally {
        setIsSaving(false);
      }
    },
    onError: () => {
      if (presence.connectionStatus !== "connected") {
        setUploadError("Gagal menyimpan perubahan ke server. Periksa koneksi Anda.");
      }
    },
  });

  useEffect(() => {
    if (selectedId && presence.connectionStatus === "connected") {
      presence.updateActiveSurface({ surface: "canvas", sectionId: selectedId });
    }
  }, [selectedId, presence.connectionStatus]);

  useEffect(() => {
    if (!previewReadyRef.current) return;
    previewFrameRef.current?.contentWindow?.postMessage({ source: EDITOR_MESSAGE_SOURCE, type: "preview-state", sections: previewSections, themeId, settings: previewSettings }, "*");
  }, [previewSections, previewSettings, themeId]);

  useEffect(() => {
    const receivePreviewMessage = (event: MessageEvent) => {
      if (event.source !== previewFrameRef.current?.contentWindow) return;
      if (!isPreviewMessage(event.data)) return;
      if (event.data.type === "ready") {
        previewReadyRef.current = true;
        previewFrameRef.current?.contentWindow?.postMessage({ source: EDITOR_MESSAGE_SOURCE, type: "preview-state", sections: previewSections, themeId, settings: previewSettings }, "*");
        if (pendingNavigationRef.current) {
          previewFrameRef.current?.contentWindow?.postMessage({ source: EDITOR_MESSAGE_SOURCE, type: "navigate-section", ...pendingNavigationRef.current }, "*");
        }
      }
      if (event.data.type === "state-applied" && !pendingNavigationRef.current) setIsPreviewLoading(false);
      if ((event.data.type === "navigation-complete" || event.data.type === "navigation-cancelled") && pendingNavigationRef.current?.requestId === event.data.requestId) {
        pendingNavigationRef.current = null;
        setIsPreviewLoading(false);
      }
      if (event.data.type === "section-selected" || event.data.type === "active-section") {
        const section = sections.find((item) => item.type === event.data.sectionType);
        if (section) {
          const previewPanelScrollTop = previewPanelRef.current?.scrollTop ?? 0;
          setSelectedId(section.id);
          setSectionEditorOpen(true);
          setGlobalEditorOpen(false);
          window.requestAnimationFrame(() => {
            // Focus/clicks inside a tall iframe can trigger browser scroll
            // anchoring on its parent. Preserve the editor canvas position and
            // keep the document root pinned to the viewport.
            if (previewPanelRef.current) previewPanelRef.current.scrollTop = previewPanelScrollTop;
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          });
        }
      }
      if (event.data.type === "preview-pointer") {
        presence.broadcastCursor({
          surface: "preview",
          x: event.data.x,
          y: event.data.y,
          sectionId: selectedId,
        });
      }
    };
    window.addEventListener("message", receivePreviewMessage);
    return () => window.removeEventListener("message", receivePreviewMessage);
  }, [previewSections, previewSettings, sections, themeId, presence.broadcastCursor, selectedId]);

  useEffect(() => {
    if (view !== "wishes" || !draftId) return;
    const controller = new AbortController();
    fetch(`/api/wishes?invitationId=${encodeURIComponent(draftId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : { wishes: [] })
      .then((payload) => setWishRecords(payload.wishes ?? []))
      .finally(() => { if (!controller.signal.aborted) setWishesLoading(false); });
    return () => controller.abort();
  }, [draftId, view]);

  function handleDragEnd(event: DragEndEvent) {
    if (isViewer) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0 || !items[oldIndex].reorderable) return items;
      const reordered = arrayMove(items, oldIndex, newIndex);

      collabDoc.updateLocalState((doc) => {
        const orderArray = doc.getArray<string>("sectionOrder");
        orderArray.delete(0, orderArray.length);
        orderArray.push(reordered.map((s) => s.id));
      });

      return reordered;
    });
  }

  const updateSectionFields = useCallback((sectionId: string, values: Record<string, unknown>) => {
    if (isViewer) return;
    setSections((items) =>
      items.map((sec) =>
        sec.id === sectionId ? { ...sec, defaultData: { ...sec.defaultData, ...values } } : sec
      )
    );

    collabDoc.updateLocalState((doc) => {
      const sectionsMap = doc.getMap("sections");
      let secMap = sectionsMap.get(sectionId) as Y.Map<unknown> | undefined;
      if (!secMap) {
        const currentSec = sections.find((s) => s.id === sectionId);
        secMap = new Y.Map();
        secMap.set("id", sectionId);
        secMap.set("type", currentSec?.type ?? "");
        secMap.set("enabled", currentSec?.enabled ?? true);
        secMap.set("data", new Y.Map());
        sectionsMap.set(sectionId, secMap);
      }
      let dataMap = secMap.get("data") as Y.Map<unknown> | undefined;
      if (!dataMap) {
        dataMap = new Y.Map();
        secMap.set("data", dataMap);
      }
      for (const [k, v] of Object.entries(values)) {
        dataMap.set(k, v);
      }
    });
  }, [isViewer, sections, collabDoc]);

  const updateSectionField = useCallback((sectionId: string, key: string, value: unknown) => {
    updateSectionFields(sectionId, { [key]: value });
  }, [updateSectionFields]);

  const updateSelectedFields = useCallback((values: Record<string, unknown>) => {
    if (!selected) return;
    updateSectionFields(selected.id, values);
  }, [selected, updateSectionFields]);

  const updateSelected = useCallback((key: string, value: unknown) => {
    if (!selected) return;
    updateSectionFields(selected.id, { [key]: value });
  }, [selected, updateSectionFields]);

  const updateSectionTextStyle = useCallback((
    sectionId: string,
    key: string,
    style: Partial<EditableTextStyle>,
    replace = false
  ) => {
    if (isViewer) return;
    setSections((items) =>
      items.map((section) => {
        if (section.id !== sectionId) return section;
        const current =
          section.defaultData.textStyles && typeof section.defaultData.textStyles === "object"
            ? (section.defaultData.textStyles as Record<string, EditableTextStyle>)
            : {};
        return {
          ...section,
          defaultData: {
            ...section.defaultData,
            textStyles: {
              ...current,
              [key]: replace ? {} : { ...(current[key] ?? {}), ...style },
            },
          },
        };
      })
    );

    collabDoc.updateLocalState((doc) => {
      const sectionsMap = doc.getMap("sections");
      let secMap = sectionsMap.get(sectionId) as Y.Map<unknown> | undefined;
      if (!secMap) {
        const currentSec = sections.find((section) => section.id === sectionId);
        secMap = new Y.Map();
        secMap.set("id", sectionId);
        secMap.set("type", currentSec?.type ?? "");
        secMap.set("enabled", currentSec?.enabled ?? true);
        secMap.set("data", new Y.Map());
        sectionsMap.set(sectionId, secMap);
      }

      let stylesMap = secMap.get("textStyles") as Y.Map<unknown> | undefined;
      if (!(stylesMap instanceof Y.Map)) {
        stylesMap = new Y.Map();
        secMap.set("textStyles", stylesMap);
      }

      const previousStyle = stylesMap.get(key);
      const fieldStyleMap = new Y.Map();
      if (!replace && previousStyle instanceof Y.Map) {
        previousStyle.forEach((value, styleKey) => fieldStyleMap.set(styleKey, value));
      } else if (!replace && previousStyle && typeof previousStyle === "object") {
        Object.entries(previousStyle as Record<string, unknown>).forEach(([styleKey, value]) => fieldStyleMap.set(styleKey, value));
      }
      Object.entries(style).forEach(([styleKey, value]) => {
        if (value === undefined) fieldStyleMap.delete(styleKey);
        else fieldStyleMap.set(styleKey, value);
      });
      stylesMap.set(key, fieldStyleMap);
    });
  }, [isViewer, collabDoc, sections]);

  const updateSelectedTextStyle = useCallback((key: string, style: Partial<EditableTextStyle>, replace = false) => {
    if (!selected) return;
    updateSectionTextStyle(selected.id, key, style, replace);
  }, [selected, updateSectionTextStyle]);

  const broadcastFieldFocus = useCallback((sectionId: string, fieldKey: string | null) => {
    presence.updateActiveSurface({
      surface: "right-sidebar",
      sectionId: fieldKey ? sectionId : null,
      fieldPath: fieldKey,
    });
  }, [presence]);

  const activeFieldCollaborator = useCallback((sectionId: string, fieldKey: string) => {
    const now = Date.now();
    const match = presence.allPresences.find(
      (p) =>
        p.userId !== currentUser?.id &&
        p.sectionId === sectionId &&
        p.fieldPath === fieldKey &&
        p.state === "active" &&
        now - p.lastSeenAt < 25_000
    );
    return match ? { name: match.name, color: match.color } : null;
  }, [presence.allPresences, currentUser?.id]);

  const collaborativeContextValue: CollaborativeContextValue = useMemo(() => ({
    isViewer,
    disabled: !authResolved || Boolean(currentUser && !draftReady),
    updateField: updateSectionField,
    updateFields: updateSectionFields,
    updateTextStyle: updateSectionTextStyle,
    updateGlobalSetting,
    toggleSection: handleSectionToggle,
    activeFieldCollaborator,
    broadcastFieldFocus,
  }), [
    isViewer,
    authResolved,
    currentUser,
    draftReady,
    updateSectionField,
    updateSectionFields,
    updateSectionTextStyle,
    updateGlobalSetting,
    handleSectionToggle,
    activeFieldCollaborator,
    broadcastFieldFocus,
  ]);

  function selectEditorSection(section: EditableSection) {
    setSelectedId(section.id);
    setSectionEditorOpen(true);
    setGlobalEditorOpen(false);
    if (isInspectorCollapsed) {
      setIsInspectorCollapsed(false);
      window.localStorage.setItem(`undangan-console:inspector-collapsed:${template.code}`, "false");
    }
    if (!section.enabled) return;
    const navigation: PendingNavigation = { sectionType: section.type, requestId: crypto.randomUUID(), navigationSource: "editor-sidebar" };
    pendingNavigationRef.current = navigation;
    setIsPreviewLoading(true);
    previewFrameRef.current?.contentWindow?.postMessage({ source: EDITOR_MESSAGE_SOURCE, type: "navigate-section", ...navigation }, "*");
  }

  async function uploadAsset(file: File, sectionId: string, currentDraftId: string) {
    const processedFile = file.type.startsWith("image/") ? await compressImage(file) : file;
    const form = new FormData();
    form.set("file", processedFile);
    form.set("sectionId", sectionId);
    const response = await fetch(`/api/drafts/${currentDraftId}/assets`, { method: "POST", body: form });
    const payload = await response.json().catch(() => ({ error: "Respons upload tidak valid." }));
    if (!response.ok || !payload.url) throw new Error(payload.error ?? "Upload foto gagal.");
    return { url: payload.url as string, name: processedFile.name };
  }

  async function uploadSelectedImages(files: File[], target: "content" | "background") {
    if (isViewer || !files.length || !selected || !draftId) return;
    const targetSectionId = selected.id;
    const targetSectionType = selected.type;
    const currentDraftId = draftId;
    const selectedFiles = files.slice(0, targetSectionType === "gallery" && target === "content" ? 4 : 1);
    setUploadError("");
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(selectedFiles.map((file) => uploadAsset(file, targetSectionId, currentDraftId)));
      if (target === "background") {
        updateSelectedFields({
          backgroundImageUrl: uploaded[0].url,
          backgroundImageLabel: uploaded[0].name,
        });
      } else if (targetSectionType === "gallery") {
        const current = Array.isArray(selected.defaultData.imageUrls)
          ? (selected.defaultData.imageUrls as string[])
          : [];
        const imageUrls = [...current, ...uploaded.map((a) => a.url)].slice(-4);
        updateSelectedFields({
          imageUrls,
          imageLabel: `${imageUrls.length} foto galeri`,
        });
      } else {
        updateSelectedFields({
          imageUrl: uploaded[0].url,
          imageLabel: uploaded[0].name,
        });
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload foto gagal. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
      window.requestAnimationFrame(() => {
        if (window.matchMedia("(min-width: 1024px)").matches) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      });
    }
  }

  function requestLogin(reason: string) {
    setLoginReason(reason);
    setLoginModalOpen(true);
  }

  function changeView(nextView: View) {
    if (nextView === "wishes" && !currentUser) {
      requestLogin("Masuk dengan Google untuk melihat ucapan milik undangan yang Anda kelola.");
      return;
    }
    setView(nextView);
  }

  function canUpload(reason: string) {
    if (isViewer) return false;
    if (!authResolved) return false;
    if (!currentUser) {
      requestLogin(reason);
      return false;
    }
    if (!draftId || !draftReady) {
      setUploadError("Draft akun sedang disiapkan. Tunggu sebentar lalu coba lagi.");
      return false;
    }
    return true;
  }

  async function handleMusicSelection(event: ChangeEvent<HTMLInputElement>) {
    if (isViewer) return;
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!currentUser) {
      requestLogin("Masuk dengan Google terlebih dahulu untuk mengunggah musik undangan.");
      return;
    }
    if (!draftId || !selected || !draftReady) {
      setUploadError("Draft akun sedang disiapkan. Tunggu sebentar lalu coba lagi.");
      return;
    }
    setUploadError("");
    setIsUploading(true);
    try {
      const uploaded = await uploadAsset(file, selected.id, draftId);
      handleMusicUrlChange(uploaded.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload musik gagal.");
    } finally {
      setIsUploading(false);
    }
  }

  function openAssetLibrary(kind: "image" | "audio", target: AssetTarget["target"]) {
    if (!authResolved) return;
    if (!currentUser) {
      requestLogin(`Masuk dengan Google untuk membuka Asset Saya.`);
      return;
    }
    setAssetTarget({ kind, target, sectionId: target === "music" || target === "manager" ? null : selected?.id ?? null });
  }

  function selectLibraryAsset(asset: UserAsset) {
    const target = assetTarget;
    if (!target) return;
    if (target.target === "music") {
      handleMusicUrlChange(asset.url);
      setAssetTarget(null);
      return;
    }
    if (target.target === "background") {
      updateSelectedFields({
        backgroundImageUrl: asset.url,
        backgroundImageLabel: asset.name ?? "Asset Saya",
      });
    } else if (selected?.type === "gallery") {
      const current = Array.isArray(selected.defaultData.imageUrls)
        ? (selected.defaultData.imageUrls as string[])
        : [];
      const imageUrls = [...current.filter((url) => url !== asset.url), asset.url].slice(-4);
      updateSelectedFields({
        imageUrls,
        imageLabel: `${imageUrls.length} foto galeri`,
      });
    } else {
      updateSelectedFields({
        imageUrl: asset.url,
        imageLabel: asset.name ?? "Asset Saya",
      });
    }
    setAssetTarget(null);
  }

  function updateInspectorWidth(clientX: number) {
    const maximum = Math.min(620, Math.max(320, window.innerWidth - 700));
    const nextWidth = Math.round(Math.min(maximum, Math.max(280, window.innerWidth - clientX)));
    inspectorWidthRef.current = nextWidth;
    setInspectorWidth(nextWidth);
  }

  function startInspectorResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (window.innerWidth < 1024) return;
    event.preventDefault();
    inspectorResizeRef.current = true;
    setIsInspectorResizing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    updateInspectorWidth(event.clientX);
  }

  function moveInspectorResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (inspectorResizeRef.current) updateInspectorWidth(event.clientX);
  }

  function stopInspectorResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (!inspectorResizeRef.current) return;
    inspectorResizeRef.current = false;
    setIsInspectorResizing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.localStorage.setItem(`undangan-console:inspector-width:${template.code}`, String(inspectorWidthRef.current));
  }

  function resetInspectorWidth() {
    inspectorWidthRef.current = 340;
    setInspectorWidth(340);
    window.localStorage.setItem(`undangan-console:inspector-width:${template.code}`, "340");
  }

  function getWhatsAppMessage(preset: "formal" | "islami" | "casual" | "english", name: string) {
    const formattedName = name.trim().replace(/\s+/g, " ") || "Bapak/Ibu/Saudara/i";
    const slug = publishIdentifier || "ayuardi";
    const invitationPath = buildInvitationUrl(slug, formattedName);

    const cat = (template.category || "wedding").toLowerCase();
    const mempelaiSection = sections.find((s) => s.type === "mempelai" || s.type === "couple");
    const heroSection = sections.find((s) => s.type === "hero" || s.type === "opening");

    // Wedding
    if (cat === "wedding" || cat === "pernikahan") {
      const bride = String(mempelaiSection?.defaultData?.brideShortName || mempelaiSection?.defaultData?.brideName || "Ayu");
      const groom = String(mempelaiSection?.defaultData?.groomShortName || mempelaiSection?.defaultData?.groomName || "Ardi");
      const couple = `${bride} & ${groom}`;

      switch (preset) {
        case "formal":
          return `Assalamu'alaikum Wr. Wb.\n\nKepada Yth.\nBpk/Ibu/Saudara/i *${formattedName}*\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara resepsi pernikahan kami:\n\n*${couple}*\n\nBerikut tautan undangan untuk info lengkap acara & lokasi:\n${invitationPath}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.\n\nTerima kasih atas perhatian dan doanya.\nWassalamu'alaikum Wr. Wb.`;
        case "islami":
          return `Bismillahirrahmannirrahim\n\n_Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan._\n\nDengan memohon ridho dan rahmat Allah SWT, kami bermaksud mengundang Bpk/Ibu/Saudara/i *${formattedName}* pada acara pernikahan kami:\n\n*${couple}*\n\nInfo lengkap & lokasi acara dapat diakses melalui:\n${invitationPath}\n\nDoa restu dan kehadiran Bapak/Ibu/Saudara/i merupakan kebahagiaan yang tak ternilai bagi kami.\n\nJazakumullah Khairan Katsiran.\nWassalamu'alaikum Wr. Wb.`;
        case "casual":
          return `Hai *${formattedName}*! ✨\n\nSave the date yaa! Kami mau berbagi kabar bahagia dan mengundang kamu untuk hadir di pesta pernikahan kami:\n\n🎉 *${couple}* 🎉\n\nCek detail acara dan lokasinya di link undangan ini ya:\n${invitationPath}\n\nKehadiran dan doa dari kamu pasti bikin hari bahagia kami makin lengkap. See you there! 🙌`;
        case "english":
          return `Dear *${formattedName}*,\n\nTogether with our families, we joyfully invite you to celebrate the wedding of:\n\n*${couple}*\n\nPlease find the event details and location through this link:\n${invitationPath}\n\nYour presence and prayers would mean the world to us as we begin this new journey together.\n\nWarm regards,\n${couple}`;
      }
    }

    // Khitanan
    if (cat === "khitanan" || cat.includes("khitan")) {
      const child = String(heroSection?.defaultData?.childName || heroSection?.defaultData?.title || "Putra Kami");

      switch (preset) {
        case "formal":
          return `Assalamu'alaikum Wr. Wb.\n\nKepada Yth.\nBpk/Ibu/Saudara/i *${formattedName}*\n\nDengan memohon rahmat Allah SWT, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara tasyakuran khitanan putra kami:\n\n*${child}*\n\nInformasi lengkap mengenai jadwal dan lokasi acara dapat diakses melalui:\n${invitationPath}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.\n\nWassalamu'alaikum Wr. Wb.`;
        case "islami":
          return `Bismillahirrahmannirrahim\n\nDengan memohon ridho dan rahmat Allah SWT, kami bermaksud mengundang Bpk/Ibu/Saudara/i *${formattedName}* pada acara tasyakuran khitanan putra kami:\n\n*${child}*\n\nInfo lengkap & lokasi acara:\n${invitationPath}\n\nSemoga ananda menjadi anak yang sholeh, berbakti kepada kedua orang tua, agama, dan bangsa. Kehadiran dan doa restu Bapak/Ibu merupakan kebahagiaan bagi keluarga kami.\n\nJazakumullah Khairan Katsiran.\nWassalamu'alaikum Wr. Wb.`;
        case "casual":
          return `Hai *${formattedName}*! ✨\n\nKami mau mengundang kamu untuk hadir dan meramaikan acara tasyakuran khitanan adik kita:\n\n🎉 *${child}* 🎉\n\nYuk cek jadwal dan lokasi lengkapnya di link undangan ini:\n${invitationPath}\n\nKehadiran dan doa kamu sangat berarti buat kami. Ditunggu kedatangannya ya! 🙌`;
        case "english":
          return `Dear *${formattedName}*,\n\nWith great joy, our family cordially invites you to the Circumcision (Khitanan) Thanksgiving Celebration of our beloved son:\n\n*${child}*\n\nPlease find the event details and venue location through this link:\n${invitationPath}\n\nYour presence and warm prayers would be a blessing to our family.\n\nWarm regards,\nThe Family`;
      }
    }

    // Aqiqah
    if (cat === "aqiqah" || cat.includes("aqiqah")) {
      const baby = String(heroSection?.defaultData?.babyName || heroSection?.defaultData?.childName || "Putra/Putri Tercinta");

      switch (preset) {
        case "formal":
          return `Assalamu'alaikum Wr. Wb.\n\nKepada Yth.\nBpk/Ibu/Saudara/i *${formattedName}*\n\nSebagai wujud rasa syukur kami atas kelahiran buah hati kami, perkenankan kami mengundang Bapak/Ibu/Saudara/i pada acara Tasyakuran Aqiqah:\n\n*${baby}*\n\nDetail jadwal & lokasi acara dapat dilihat pada tautan berikut:\n${invitationPath}\n\nAtas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami ucapkan terima kasih yang sebesar-besarnya.\n\nWassalamu'alaikum Wr. Wb.`;
        case "islami":
          return `Bismillahirrahmannirrahim\n\n_Segala puji bagi Allah SWT atas amanah dan karunia buah hati yang dianugerahkan kepada keluarga kami._\n\nKami mengundang Bpk/Ibu/Saudara/i *${formattedName}* untuk menghadiri acara Tasyakuran Aqiqah putra/putri kami:\n\n*${baby}*\n\nInfo lengkap acara & lokasi:\n${invitationPath}\n\nSemoga ananda tumbuh sehat, cerdas, berakhlak mulia, dan senantiasa dalam lindungan Allah SWT.\n\nJazakumullah Khairan Katsiran.\nWassalamu'alaikum Wr. Wb.`;
        case "casual":
          return `Hai *${formattedName}*! 👶✨\n\nAlhamdulillah, kami mau berbagi kebahagiaan atas kelahiran buah hati kami dan mengundang kamu di acara Tasyakuran Aqiqah:\n\n🌟 *${baby}* 🌟\n\nCek waktu dan lokasi acaranya di link ini ya:\n${invitationPath}\n\nYuk datang dan doakan si kecil bersama kami! Sampai jumpa yaa 🙌`;
        case "english":
          return `Dear *${formattedName}*,\n\nWith grateful hearts for the gift of our precious baby, we joyfully invite you to the Aqiqah Celebration of:\n\n*${baby}*\n\nPlease find the celebration details and location here:\n${invitationPath}\n\nYour presence and blessings mean the world to our family.\n\nWarm regards,\nThe Family`;
      }
    }

    // Birthday / Ulang Tahun
    if (cat === "birthday" || cat.includes("birth") || cat.includes("ulang")) {
      const person = String(heroSection?.defaultData?.name || heroSection?.defaultData?.birthdayPerson || "Teman Kami");

      switch (preset) {
        case "formal":
          return `Kepada Yth.\nBpk/Ibu/Saudara/i *${formattedName}*\n\nDengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara perayaan ulang tahun:\n\n*${person}*\n\nInformasi lengkap mengenai waktu dan lokasi acara dapat diakses melalui:\n${invitationPath}\n\nMerupakan suatu kebahagiaan bagi kami atas kehadiran dan doa restu Bapak/Ibu/Saudara/i.\n\nTerima kasih atas perhatiannya.`;
        case "islami":
          return `Bismillahirrahmannirrahim\n\nSebagai wujud rasa syukur kami atas bertambahnya usia dan limpahan rahmat Allah SWT, kami mengundang Bpk/Ibu/Saudara/i *${formattedName}* pada acara syukuran ulang tahun:\n\n*${person}*\n\nInfo lengkap acara:\n${invitationPath}\n\nSemoga senantiasa diberikan umur yang berkah, kesehatan, dan kemudahan dalam segala urusan.\n\nJazakumullah Khairan Katsiran.`;
        case "casual":
          return `Hai *${formattedName}*! 🥳🎉\n\nIt's party time! Kami mengundang kamu untuk datang dan merayakan hari ulang tahun:\n\n🎂 *${person}* 🎂\n\nCek info detail acara dan lokasinya di sini ya:\n${invitationPath}\n\nPasti seru banget kalau kamu hadir! See you at the party! ✨`;
        case "english":
          return `Dear *${formattedName}*,\n\nYou are warmly invited to join the Birthday Celebration of:\n\n*${person}*\n\nPlease check all event details and venue location through this link:\n${invitationPath}\n\nWe look forward to celebrating this special day with you!\n\nWarm regards,\n${person}`;
      }
    }

    // Default / General Event
    return `Kepada Yth.\nBpk/Ibu/Saudara/i *${formattedName}*\n\nKami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara kami:\n\n*${template.name}*\n\nBerikut tautan undangan untuk info lengkap acara & lokasi:\n${invitationPath}\n\nTerima kasih atas perhatian dan kehadirannya.`;
  }

  function handlePublishResult(result: PublishResult) {
    setPublishIdentifier(result.identifier);
    if (result.mode !== "custom_domain") setPublishMode(result.mode);
    setIsPublishOpen(false);
    setView("editor");
    if (result.status === "published") {
      setDraftStatus("published");
      setIsPublished(true);
      setPublishUrl(result.url);
      setPublishNotice({ tone: "success", message: "Selamat, undangan Anda telah berhasil dipublish. Silakan ke halaman Generator untuk memberi nama dan membagikan undangan kepada tamu pertama Anda." });
      return;
    }
    setDraftStatus("custom");
    setIsPublished(false);
    setPublishUrl("");
    setPublishNotice({ tone: "custom", message: result.mode === "subdomain" ? "Request subdomain berhasil dibuat. Status undangan kini Custom dan akan dikonfirmasi oleh admin." : "Request custom domain berhasil dibuat. Lanjutkan koordinasi konfigurasi domain bersama admin." });
  }

  function refreshPreview() {
    setIsRefreshing(true);
    setIsPreviewLoading(true);
    previewReadyRef.current = false;
    if (previewFrameRef.current) {
      try {
        previewFrameRef.current.contentWindow?.location.reload();
      } catch {
        previewFrameRef.current.src = previewFrameRef.current.src;
      }
    }
    window.setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }

  return (
    <CollaborativeProvider value={collaborativeContextValue}>
      <main className={`${view === "editor" ? "fixed inset-0 flex h-dvh max-h-dvh flex-col overflow-hidden" : "min-h-screen"} bg-slate-50 text-slate-900`}>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl transition hover:scale-105" title="Kembali ke Beranda">
            <Image src="/assets/fav.png" width={36} height={36} alt="Undangan Studio" className="h-full w-full object-cover" priority />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-900 leading-tight">Undangan Studio</p>
            <div className="truncate text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
              <span>{template.name} · <span className="font-mono text-slate-600">{template.code}</span></span>
              {isViewer ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-700 border border-amber-200/80">
                  <Eye size={10} /> Viewer
                </span>
              ) : !isOwner ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 border border-emerald-200/80">
                  Editor
                </span>
              ) : null}
              {draftReady && (
                <>
                  <span className="text-slate-300">·</span>
                  <AutoSaveStatusBadge
                    status={collabDoc.syncStatus === "saving" ? "saving" : autoSaveStatus}
                    isCloud={Boolean(currentUser)}
                    onRetry={flushAutoSave}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="hidden xl:flex items-center rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 shadow-xs shrink-0">
          {([["editor", "Editor", LayoutPanelTop], ["generator", "Generator", Send], ["wishes", "Ucapan", MessageCircleHeart]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => changeView(id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                view === id
                  ? "bg-white text-emerald-700 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Icon size={13} className={view === id ? "text-emerald-600" : "text-slate-400"} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Right Actions: Presence, User Profile Dropdown, Collaboration & Publish Button */}
        <div className="flex items-center gap-2 shrink-0">
          {currentUser && draftId && (
            <div className="flex items-center gap-1.5 mr-1">
              <CollaborationStatus status={presence.connectionStatus} onlineCount={presence.onlineCount} />
              <CollaboratorAvatarStack
                onlineUsers={presence.onlineUsers}
                currentUserId={currentUser?.id}
                onOpenInviteModal={() => setIsInviteModalOpen(true)}
              />
            </div>
          )}

          {/* Quick Invite Team Button */}
          {isOwner && (
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  requestLogin("Masuk dengan Google untuk mengundang kolaborator.");
                } else {
                  setIsInviteModalOpen(true);
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-emerald-700 active:scale-95"
              title="Undang kolaborator untuk mengedit bersama"
            >
              <UserPlus size={14} className="text-emerald-600" />
              <span>Undang</span>
            </button>
          )}

          <UserAuthDropdown
            user={currentUser}
            compact={true}
            onLoginClick={() => requestLogin("Masuk dengan Google untuk menyimpan dan mengelola undangan Anda.")}
            onLogout={() => {
              setCurrentUser(null);
              window.location.reload();
            }}
            onMyInvitationsClick={() => {
              setIsMyInvitationsOpen(true);
            }}
            onInviteCollaboratorClick={() => {
              if (!currentUser) {
                requestLogin("Masuk dengan Google untuk mengundang kolaborator.");
              } else {
                setIsInviteModalOpen(true);
              }
            }}
          />

          {isOwner ? (
            <button
              type="button"
              disabled={!authResolved}
              onClick={() => {
                if (!authResolved || !currentUser) requestLogin("Masuk dengan Google untuk menyimpan dan mempublish undangan Anda.");
                else setIsPublishOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:cursor-wait disabled:opacity-50"
            >
              {draftStatus === "published" ? <Check size={14} /> : draftStatus === "custom" ? <LoaderCircle size={14} /> : <Upload size={14} />}
              <span>{draftStatus === "published" ? "Published" : draftStatus === "custom" ? "Menunggu Admin" : "Publish"}</span>
            </button>
          ) : (
            <span
              title="Hanya pemilik undangan yang dapat mempublikasikan undangan ke domain live."
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed"
            >
              <Shield size={13} className="text-slate-400" />
              <span>{draftStatus === "published" ? "Published" : "Dibagikan"}</span>
            </span>
          )}
        </div>
      </header>

      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-1.5 md:hidden">
        {([["editor", "Editor", LayoutPanelTop], ["generator", "Generator", Send], ["wishes", "Ucapan", MessageCircleHeart]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => changeView(id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
              view === id ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600"
            }`}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Network Offline / Reconnecting Floating Banner */}
      {(!isOnline || presence.connectionStatus === "connecting") && authResolved && currentUser && draftId && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50/95 px-4 py-1.5 text-xs font-bold text-amber-900 shadow-lg backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          {!isOnline ? <WifiOff size={14} className="text-amber-600" /> : <LoaderCircle size={14} className="animate-spin text-amber-600" />}
          <span>{!isOnline ? "Anda sedang offline. Perubahan disimpan secara lokal." : "Koneksi terputus. Mencoba menyambung kembali..."}</span>
        </div>
      )}

      {showReconnectedBadge && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50/95 px-4 py-1.5 text-xs font-bold text-emerald-900 shadow-lg backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          <Check size={14} className="text-emerald-600 font-extrabold" />
          <span>Terhubung kembali ke server kolaborasi</span>
        </div>
      )}

      {view === "editor" && (
        <div
          className={`editor-workspace-grid relative flex flex-col flex-1 min-h-0 overflow-hidden lg:grid lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:[overflow-anchor:none] ${
            isInspectorResizing ? "is-resizing" : ""
          } ${isStructureCollapsed ? "is-structure-collapsed" : ""} ${isInspectorCollapsed ? "is-inspector-collapsed" : ""}`}
          style={{ "--inspector-width": isInspectorCollapsed ? "0px" : `${inspectorWidth}px` } as CSSProperties}
        >
          {/* Floating Expand Tab for Structure (When Left Sidebar is Collapsed on Desktop) */}
          {isStructureCollapsed && (
            <button
              type="button"
              onClick={() => {
                setIsStructureCollapsed(false);
                window.localStorage.setItem(`undangan-console:structure-collapsed:${template.code}`, "false");
              }}
              title="Buka struktur section (Klik untuk expand)"
              className="fixed left-0 top-1/2 z-40 -translate-y-1/2 hidden lg:flex items-center gap-1.5 rounded-r-2xl border border-l-0 border-slate-200/90 bg-white/95 px-2.5 py-4 text-xs font-bold text-slate-700 shadow-[4px_6px_24px_rgba(15,23,42,0.12)] backdrop-blur-md hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 transition group cursor-pointer"
            >
              <PanelLeftOpen size={16} className="text-emerald-600 group-hover:scale-110 transition" />
              <span className="[writing-mode:vertical-lr] text-[10px] tracking-widest uppercase font-extrabold text-slate-600 group-hover:text-emerald-700">
                Struktur
              </span>
            </button>
          )}

          <aside
            ref={structurePanelRef}
            onPointerMove={(e) => {
              if (e.pointerType === "touch") return;
              const rect = e.currentTarget.getBoundingClientRect();
              presence.broadcastCursor({
                surface: "left-sidebar",
                x: Math.round(e.clientX - rect.left),
                y: Math.round(e.clientY - rect.top),
                sectionId: selectedId,
              });
            }}
            className={`console-scrollbar relative overflow-y-auto overscroll-contain bg-white p-4 lg:h-full lg:max-h-none lg:border-r border-slate-200 transition-all duration-200 ${
              isStructureCollapsed ? "hidden" : "hidden lg:block"
            }`}
          >
            <RemoteCursorLayer cursors={presence.remoteCursors} surface="left-sidebar" />

            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-slate-900">Struktur Undangan</p>
                <p className="mt-0.5 text-[10px] text-slate-500">Geser section untuk mengatur urutan.</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {sections.length}
                </span>
                <button
                  type="button"
                  onClick={toggleStructureCollapse}
                  title="Tutup sidebar struktur (Zen Mode)"
                  className="hidden lg:grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <PanelLeftClose size={15} />
                </button>
              </div>
            </div>

            {/* Quick Search Section Filter */}
            <div className="relative mb-3">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={sectionSearchQuery}
                onChange={(e) => setSectionSearchQuery(e.target.value)}
                placeholder="Cari section (Akad, Galeri)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-7 text-[11px] font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
              {sectionSearchQuery && (
                <button
                  type="button"
                  onClick={() => setSectionSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-4 w-4 place-items-center rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {sectionSearchQuery ? (
              <div className="space-y-1.5">
                {filteredSections.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    Tidak ada section &quot;{sectionSearchQuery}&quot;
                  </p>
                ) : (
                  filteredSections.map((section) => (
                    <div
                      key={section.id}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                        section.id === selectedId
                          ? "border-emerald-600 bg-emerald-50/70 shadow-xs"
                          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectEditorSection(section)}
                        className="min-w-0 flex-1 text-left flex items-center justify-between gap-1.5"
                      >
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-bold text-slate-800">{section.label}</span>
                          <span className="block truncate text-[10px] text-slate-500">{section.required ? "Wajib" : "Opsional"}</span>
                        </div>
                        <CollaboratorSectionBadge sectionId={section.id} onlineUsers={presence.onlineUsers} currentUserId={currentUser?.id} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSectionToggle(section.id)}
                        className={`h-5 w-9 rounded-full p-0.5 transition ${section.enabled ? "bg-emerald-600" : "bg-slate-200"}`}
                      >
                        <span className={`block h-4 w-4 rounded-full bg-white shadow transition ${section.enabled ? "translate-x-4" : ""}`} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <DndContext id="wedding-section-sorter" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {sections.map((section) => (
                      <SortableSectionRow
                        key={section.id}
                        section={section}
                        active={section.id === selectedId}
                        onlineUsers={presence.onlineUsers}
                        currentUserId={currentUser?.id}
                        onSelect={() => selectEditorSection(section)}
                        onToggle={() => handleSectionToggle(section.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </aside>

          <section
            ref={previewPanelRef}
            onPointerMove={(e) => {
              if (e.pointerType === "touch") return;
              const rect = e.currentTarget.getBoundingClientRect();
              presence.broadcastCursor({
                surface: "canvas",
                x: Math.round(e.clientX - rect.left),
                y: Math.round(e.clientY - rect.top),
                sectionId: selectedId,
              });
            }}
            className="console-scrollbar relative flex-1 min-h-0 overflow-y-auto overscroll-contain overflow-x-hidden bg-slate-100 p-3 sm:p-5 md:p-8 lg:h-full lg:min-h-0 lg:[overflow-anchor:none]"
          >
            <RemoteCursorLayer cursors={presence.remoteCursors} surface="canvas" />

            {/* Canvas Toolbar: Zoom & Device Frame Switcher */}
            <div className={`mx-auto mb-3 flex max-w-full items-center justify-between gap-2 ${frameMode === "desktop" ? "w-[min(1100px,100%)]" : "w-[500px]"}`}>
              {/* Left: Refresh & Zoom Controls */}
              <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
                <button
                  type="button"
                  onClick={refreshPreview}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600 active:scale-95"
                  title="Muat ulang iframe preview"
                  aria-label="Refresh preview"
                >
                  <RotateCw size={13} className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
                </button>

                <div className="h-4 w-px bg-slate-200" />

                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.max(0.65, Number((z - 0.1).toFixed(2))))}
                  title="Perkecil Kanvas"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition"
                >
                  <ZoomOut size={13} />
                </button>

                <span className="min-w-10 text-center text-sm font-semibold text-slate-600">
                  {Math.round(zoomScale * 100)}%
                </span>

                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
                  title="Perbesar Kanvas"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition"
                >
                  <ZoomIn size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => setZoomScale(1)}
                  title="Reset Zoom (100%)"
                  className="inline-flex h-7 items-center justify-center rounded-lg px-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  100%
                </button>
              </div>

              {/* Center/Right: Device Frame Switcher (Only desktop / clean / iOS / Android) */}
              <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setFrameMode("desktop")}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition ${
                    frameMode === "desktop" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Tampilan Desktop Viewport"
                >
                  <Monitor size={13} />
                  <span className="hidden sm:inline">Desktop</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFrameMode("ios")}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition ${
                    frameMode === "ios" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Tampilan Frame iPhone"
                >
                  <Smartphone size={13} />
                  <span className="hidden sm:inline">iPhone</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFrameMode("android")}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition ${
                    frameMode === "android"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  title="Frame Android (Camera Punchhole)"
                >
                  <Smartphone size={12} />
                  <span>Android</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFrameMode("clean")}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition ${
                    frameMode === "clean"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  title="Tampilan Minimalis Tanpa Frame"
                >
                  <Maximize2 size={12} />
                  <span>Clean</span>
                </button>
              </div>
            </div>

            <div
              style={{
                transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
                transformOrigin: "top center",
                transition: "transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
              className={`relative mx-auto box-border ${
                frameMode === "desktop"
                  ? "w-full min-w-[768px] max-w-[1100px]"
                  : "w-[330px] max-w-[82vw] sm:w-[380px] sm:max-w-full"
              } ${
                frameMode === "desktop"
                  ? "overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_24px_70px_rgba(15,23,42,.16)]"
                  : frameMode === "clean"
                  ? "rounded-2xl border border-slate-300/80 bg-white shadow-xl p-0 overflow-hidden"
                  : frameMode === "ios"
                  ? "bg-[#171719] p-[9px] max-sm:p-1.5 shadow-[0_24px_70px_rgba(15,23,42,.2)] rounded-[48px] max-sm:rounded-[36px] border-[5px] max-sm:border-[3px] border-[#323235]"
                  : "bg-[#171719] p-[9px] max-sm:p-1.5 shadow-[0_24px_70px_rgba(15,23,42,.2)] rounded-[30px] max-sm:rounded-[24px] border-[3px] max-sm:border-[2px] border-[#424245]"
              }`}
            >
              {frameMode === "ios" && (
                <span className="pointer-events-none absolute left-1/2 top-[9px] z-20 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-[#171719]" />
              )}
              {frameMode === "android" && (
                <span className="pointer-events-none absolute left-1/2 top-4 z-20 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#171719]" />
              )}
              {frameMode === "desktop" && (
                <div className="flex h-8 items-center border-b border-slate-200 bg-slate-50 px-3 text-slate-400" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-400" />
                  <span className="ml-1.5 h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="mx-auto pr-10 text-[10px] font-semibold uppercase tracking-[.12em]">Desktop viewport</span>
                </div>
              )}
              <div className="relative">
                <RemoteCursorLayer cursors={presence.remoteCursors} surface="preview" />
                <iframe
                  ref={previewFrameRef}
                  title="Live preview Wedding Lampung"
                  src={`/template-preview?template=${encodeURIComponent(template.code)}&for=Bapak%2FIbu%2FSaudara%2Fi`}
                  style={{ height: frameMode === "desktop" ? "clamp(640px, calc(100dvh - 210px), 900px)" : "720px" }}
                  className={`block w-full border-0 bg-white ${
                    frameMode === "desktop"
                      ? "rounded-b-2xl"
                      : frameMode === "clean"
                      ? "rounded-2xl"
                      : frameMode === "ios"
                      ? "rounded-[34px]"
                      : "rounded-[23px]"
                  }`}
                />
              </div>
              {isPreviewLoading && (
                <div
                  data-preview-loading
                  className={`pointer-events-none absolute inset-0 z-30 grid place-items-center bg-white/76 backdrop-blur-md ${
                    frameMode === "desktop" ? "rounded-2xl" : frameMode === "clean" ? "rounded-2xl" : frameMode === "ios" ? "rounded-[34px]" : "rounded-[23px]"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex flex-col items-center rounded-2xl border border-white/80 bg-white/90 px-6 py-5 text-center shadow-[0_16px_45px_rgba(15,23,42,.14)]">
                    <LoaderCircle size={26} className="animate-spin text-emerald-600" />
                    <strong className="mt-3 text-xs text-slate-800">
                      {isRefreshing ? "Memuat ulang preview" : "Menuju section"}
                    </strong>
                  </div>
                </div>
              )}
              {frameMode === "ios" && (
                <span className="pointer-events-none absolute bottom-3 left-1/2 z-20 h-1 w-28 -translate-x-1/2 rounded-full bg-black/70" />
              )}
            </div>
          </section>

          {/* Backdrop for Mobile Slide-Over Inspector */}
          {!isInspectorCollapsed && (
            <div
              onClick={toggleInspectorCollapse}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
              aria-label="Tutup editor"
            />
          )}

          <aside
            ref={inspectorPanelRef}
            className={`console-scrollbar fixed inset-y-0 right-0 z-50 w-[min(400px,88vw)] max-h-none overflow-y-auto overscroll-contain border-l border-slate-200 bg-slate-50 p-3 shadow-2xl transition-transform duration-300 ease-out lg:relative lg:inset-auto lg:z-auto lg:w-auto lg:h-full lg:min-h-0 lg:max-h-none lg:shadow-none lg:transition-all lg:duration-200 ${
              isInspectorCollapsed
                ? "translate-x-full pointer-events-none lg:translate-x-0 lg:overflow-hidden lg:p-0 lg:border-0 lg:opacity-0"
                : "translate-x-0 pointer-events-auto lg:opacity-100"
            }`}
          >
            {!isInspectorCollapsed && (
              <div
                data-inspector-resizer
                role="separator"
                aria-label="Ubah lebar sidebar editor"
                aria-orientation="vertical"
                aria-valuemin={280}
                aria-valuemax={620}
                aria-valuenow={inspectorWidth}
                tabIndex={0}
                onPointerDown={startInspectorResize}
                onPointerMove={moveInspectorResize}
                onPointerUp={stopInspectorResize}
                onPointerCancel={stopInspectorResize}
                onDoubleClick={resetInspectorWidth}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                  event.preventDefault();
                  const direction = event.key === "ArrowLeft" ? 1 : -1;
                  inspectorWidthRef.current = Math.min(620, Math.max(280, inspectorWidthRef.current + direction * (event.shiftKey ? 40 : 10)));
                  setInspectorWidth(inspectorWidthRef.current);
                  window.localStorage.setItem(`undangan-console:inspector-width:${template.code}`, String(inspectorWidthRef.current));
                }}
                className="group absolute -left-1 top-0 z-20 hidden h-full w-2 touch-none cursor-col-resize outline-none lg:block"
                title="Tarik untuk mengubah lebar · klik dua kali untuk reset"
              ><span className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-slate-200 transition group-hover:w-0.5 group-hover:bg-emerald-500 group-focus:w-0.5 group-focus:bg-emerald-600" /></div>
            )}
            <div className="space-y-3">
              {/* Quick Actions Card: Full Icon Toolbar (Undo, Redo, Asset Manager, Save) - Sticky Header */}
              <div className="sticky top-0 z-30 flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_8px_24px_rgba(15,23,42,.08)] backdrop-blur-md">
                <div className="flex items-center gap-1">
                  {/* Undo Button */}
                  <button
                    type="button"
                    disabled={!canUndo}
                    onClick={handleUndo}
                    title="Undo perubahan (Ctrl+Z)"
                    className="grid h-8 w-8 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Undo2 size={15} />
                  </button>

                  {/* Redo Button */}
                  <button
                    type="button"
                    disabled={!canRedo}
                    onClick={handleRedo}
                    title="Redo perubahan (Ctrl+Y)"
                    className="grid h-8 w-8 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Redo2 size={15} />
                  </button>

                  <div className="mx-1 h-4 w-px bg-slate-200" />

                  {/* Asset Manager Modal (All Images & Audio in Manage Mode) */}
                  <button
                    type="button"
                    onClick={() => openAssetLibrary("image", "manager")}
                    title="Asset Manager (Kelola Foto & Musik)"
                    className="grid h-8 w-8 place-items-center rounded-xl text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
                  >
                    <FolderOpen size={15} />
                  </button>
                </div>

                {/* Right: Manual Save Trigger Button */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) requestLogin("Masuk dengan Google untuk menyimpan draft undangan.");
                      else if (!draftReady) setUploadError("Draft akun sedang disiapkan...");
                      else {
                        void flushAutoSave();
                      }
                    }}
                    title={
                      autoSaveStatus === "saving"
                        ? "Menyimpan perubahan..."
                        : autoSaveStatus === "unsaved"
                        ? "Simpan sekarang (Auto-save jeda 1.8s aktif)"
                        : "Semua perubahan tersimpan"
                    }
                    className={`grid h-8 w-8 place-items-center rounded-xl transition active:scale-95 ${
                      autoSaveStatus === "saving"
                        ? "bg-emerald-100 text-emerald-700 shadow-xs"
                        : autoSaveStatus === "unsaved"
                        ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                        : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    {autoSaveStatus === "saving" ? <LoaderCircle size={15} className="animate-spin text-emerald-600" /> : <Save size={15} />}
                  </button>

                  <div className="mx-0.5 h-4 w-px bg-slate-200" />

                  {/* Collapse Sidebar Button */}
                  <button
                    type="button"
                    onClick={toggleInspectorCollapse}
                    title="Tutup sidebar editor (Collapse ke kanan)"
                    className="grid h-8 w-8 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:scale-95"
                  >
                    <PanelRightClose size={15} />
                  </button>
                </div>
              </div>

              <SidebarAccordion
                title="Custom Global"
                subtitle={`${theme.label} · ${musicUrl ? "Musik aktif" : "Tanpa musik"}`}
                icon={<Palette size={17} />}
                open={globalEditorOpen}
                onToggle={() => setGlobalEditorOpen((value) => !value)}
              >
                <CollaborativeGlobalEditor
                  template={template}
                  themeId={themeId}
                  musicUrl={musicUrl}
                  musicVolume={musicVolume}
                  customColors={customThemeColors}
                  authResolved={authResolved}
                  isLoggedIn={Boolean(currentUser)}
                  draftReady={draftReady}
                  uploadError={uploadError}
                  onOpenMusicLibrary={() => openAssetLibrary("audio", "music")}
                  onRequestLogin={requestLogin}
                />
              </SidebarAccordion>

              <SidebarAccordion
                title="Custom Section"
                subtitle={selected ? `${selected.label} · ${selected.fields?.length ?? 0} field` : "Pilih section pada struktur"}
                icon={<Settings2 size={17} />}
                open={sectionEditorOpen}
                onToggle={() => setSectionEditorOpen((value) => !value)}
              >
                <CollaborativeSectionInspector
                  template={template}
                  selected={selected}
                  themeBackground={theme.colors.background}
                  uploadError={uploadError}
                  onOpenContentLibrary={() => openAssetLibrary("image", "content")}
                  onOpenBackgroundLibrary={() => openAssetLibrary("image", "background")}
                />
              </SidebarAccordion>
            </div>
          </aside>

          {/* Floating Expand Tab (When Inspector is Collapsed) */}
          {isInspectorCollapsed && (
            <button
              type="button"
              onClick={() => {
                setIsInspectorCollapsed(false);
                window.localStorage.setItem(`undangan-console:inspector-collapsed:${template.code}`, "false");
              }}
              title="Buka panel editor (Klik untuk expand)"
              className="fixed right-0 top-1/2 z-40 -translate-y-1/2 flex items-center gap-1.5 rounded-l-2xl border border-r-0 border-slate-200 bg-white/95 px-2.5 py-4 text-xs font-bold text-slate-700 shadow-[-4px_6px_24px_rgba(15,23,42,0.14)] backdrop-blur-md hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 transition group cursor-pointer"
            >
              <PanelRightOpen size={17} className="text-emerald-600 group-hover:scale-110 transition" />
              <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] tracking-widest uppercase font-extrabold text-slate-600 group-hover:text-emerald-700">
                Buka Editor
              </span>
            </button>
          )}
        </div>
      )}

      {view === "generator" && (
        <section className="mx-auto max-w-5xl px-4 py-8 md:py-12 transition-all duration-200">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 items-center rounded-full bg-emerald-100 px-2.5 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                    WhatsApp Broadcast
                  </span>
                  <span className="text-xs font-bold text-slate-400">Buku Tamu & Generator</span>
                </div>
                <h1 className="mt-1.5 text-2xl font-extrabold text-slate-900">
                  Manajemen Tamu & Broadcast WhatsApp
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  Pilih gaya bahasa undangan, lihat pratinjau pesan personal, dan kelola daftar tamu untuk broadcast WhatsApp resmi.
                </p>
              </div>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Users size={24} />
              </div>
            </div>

            {/* Step 1: Pilihan Gaya Pesan */}
            <div className="mt-6">
              <label className="block text-xs font-bold text-slate-800 mb-2.5">
                1. Pilih Format & Gaya Bahasa Template WhatsApp
              </label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {([
                  ["formal", "Formal & Santun", "Cocok untuk keluarga & rekan kerja"],
                  ["islami", "Nuansa Islami", "Lengkap dengan basmalah & doa"],
                  ["casual", "Santai & Akrab", "Asik untuk teman sebaya"],
                  ["english", "Bilingual / English", "Format internasional"],
                ] as const).map(([presetKey, label, desc]) => (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => setWaPreset(presetKey)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      waPreset === presetKey
                        ? "border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <b className={`block text-xs font-extrabold ${waPreset === presetKey ? "text-emerald-950" : "text-slate-800"}`}>
                      {label}
                    </b>
                    <small className="mt-0.5 block text-[10px] leading-tight text-slate-500">
                      {desc}
                    </small>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Live WhatsApp Chat Bubble Mockup Preview */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-800">2. Pratinjau Pesan WhatsApp ({waPreset.toUpperCase()})</p>
                <span className="text-[10px] font-semibold text-slate-400">Contoh tampilan di chat tamu</span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#e5ddd5] p-4 sm:p-5 shadow-inner">
                <div className="relative ml-auto max-w-lg rounded-2xl bg-white p-4 shadow-sm text-xs leading-relaxed text-slate-800">
                  <div className="whitespace-pre-wrap font-sans text-xs text-slate-800">
                    {getWhatsAppMessage(waPreset, "Bpk. Budi Santoso, S.Kom")}
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                    <span>{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="text-emerald-600 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Publish Status Banner */}
            {draftStatus === "custom" ? (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/90 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-200 text-indigo-900 font-bold text-xs shrink-0">
                    ⏳
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-indigo-950">Permintaan Custom Domain / Subdomain Diproses</p>
                      <span className="rounded-full bg-indigo-200/80 px-2 py-0.5 text-[9px] font-extrabold text-indigo-900 uppercase tracking-wider">
                        Status Custom
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-indigo-800/80">
                      Fitur share WhatsApp akan aktif setelah domain/subdomain resmi Anda (<code className="font-mono font-bold text-indigo-950">{publishIdentifier}</code>) selesai dikonfirmasi dan dipublish oleh admin.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={makeAdminWhatsAppUrl(`Halo Admin, saya ingin menindaklanjuti status custom domain ${publishIdentifier} untuk draft ${draftId ?? "undangan saya"}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95"
                  >
                    <span>Hubungi Admin</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ) : !isPublished || draftStatus === "draft" ? (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-200 text-amber-900 font-bold text-xs shrink-0">
                    !
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-950">Undangan Belum Dipublish</p>
                    <p className="text-[11px] text-amber-800/80">
                      Publish undangan terlebih dahulu agar tautan kirim WhatsApp menggunakan domain/path resmi Anda.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) requestLogin("Masuk dengan Google dan publish undangan Anda.");
                    else setIsPublishOpen(true);
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-amber-800 active:scale-95"
                >
                  <Upload size={14} />
                  <span>Publish Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-600 text-white font-bold text-xs shrink-0">
                    ✓
                  </span>
                  <p className="text-xs font-bold text-emerald-950">
                    Undangan Aktif & Siap Dibagikan · <span className="font-mono text-[11px] text-emerald-800 font-semibold">{publishUrl || buildInvitationUrl(publishIdentifier)}</span>
                  </p>
                </div>
                <a
                  href={publishUrl || buildInvitationUrl(publishIdentifier)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  <span>Buka Link</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* Step 4: Bulk Guest List Manager Table */}
            <div className="mt-6 border-t border-slate-100 pt-6">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800">3. Daftar Tamu Undangan Terdaftar</p>
                <span className="text-[10px] font-semibold text-slate-400">Tamu wajib terdaftar untuk menghindari manipulasi URL</span>
              </div>

              <BulkGuestManager
                draftId={draftId}
                draftStatus={draftStatus}
                templateCode={template.code}
                isPublished={isPublished}
                publishUrl={publishUrl}
                publishMode={publishMode}
                publishIdentifier={publishIdentifier}
                waPreset={waPreset}
                onRequirePublish={() => {
                  if (!currentUser) requestLogin("Masuk dengan Google dan publish undangan Anda terlebih dahulu.");
                  else setIsPublishOpen(true);
                }}
                getMessageForGuest={(name) => getWhatsAppMessage(waPreset, name)}
              />
            </div>
          </div>
        </section>
      )}

      {view === "wishes" && <section className="mx-auto max-w-3xl px-5 py-12"><div className="rounded-3xl border border-[#e5d7c8] bg-[#fffaf1] p-7 shadow-sm md:p-10"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-700">Buku tamu</p><h1 className="mt-2 text-3xl font-extrabold">Ucapan & Kehadiran</h1><p className="mt-2 text-sm leading-6 text-[#806f67]">Ucapan tamu tersimpan di MySQL khusus untuk undangan ini.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">{wishRecords.length} ucapan</span></div>{wishesLoading ? <div className="mt-7 grid place-items-center rounded-2xl border border-dashed border-[#d9c9b8] bg-white/70 p-10 text-sm text-[#9a887d]"><LoaderCircle className="mb-3 animate-spin text-emerald-600" size={28} />Memuat ucapan...</div> : wishRecords.length === 0 ? <div className="mt-7 rounded-2xl border border-dashed border-[#d9c9b8] bg-white/70 p-10 text-center text-sm text-[#9a887d]"><MessageCircleHeart className="mx-auto mb-3 text-emerald-600" size={30} />Belum ada ucapan pada undangan ini.</div> : <div className="mt-7 space-y-3">{wishRecords.map((wish) => <article key={wish.id} className="rounded-2xl border border-[#eadfd5] bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-[#4f3034]">{wish.name}</strong><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{wish.attendance}</span></div><p className="mt-2 text-sm leading-6 text-[#75645f]">{wish.message}</p><time className="mt-3 block text-[10px] text-[#a08c82]">{new Date(wish.createdAt).toLocaleString("id-ID")}</time></article>)}</div>}</div></section>}

      <PublishModal open={isPublishOpen && Boolean(currentUser)} draftId={draftId} draftReady={draftReady} initialIdentifier={publishIdentifier} templatePrice={templatePrice} currentStatus={draftStatus} publishedUrl={publishUrl} onClose={() => setIsPublishOpen(false)} onResult={handlePublishResult} />

      {publishNotice && <div className={`fixed left-1/2 top-20 z-[75] w-[min(92vw,620px)] -translate-x-1/2 rounded-2xl border p-4 shadow-[0_20px_60px_rgba(15,23,42,.24)] backdrop-blur ${publishNotice.tone === "success" ? "border-emerald-200 bg-emerald-50/95 text-emerald-950" : "border-amber-200 bg-amber-50/95 text-amber-950"}`} role="alert"><div className="flex items-start gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${publishNotice.tone === "success" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>{publishNotice.tone === "success" ? <Check size={18} /> : <LoaderCircle size={18} />}</span><div className="min-w-0 flex-1"><strong className="block text-sm">{publishNotice.tone === "success" ? "Publish berhasil!" : "Request custom diterima"}</strong><p className="mt-1 text-xs leading-5 opacity-80">{publishNotice.message}</p>{publishNotice.tone === "success" ? <button type="button" onClick={() => { setPublishNotice(null); setView("generator"); }} className="mt-3 rounded-xl bg-emerald-700 px-3 py-2 text-[10px] font-extrabold text-white hover:bg-emerald-800">Buka Generator</button> : <a href={makeAdminWhatsAppUrl(`Halo Admin, saya ingin menindaklanjuti request custom ${publishIdentifier} untuk draft ${draftId ?? "saya"}.`)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-[10px] font-extrabold text-white hover:bg-amber-700">Hubungi admin, klik di sini! <ExternalLink size={12} /></a>}</div><button type="button" onClick={() => setPublishNotice(null)} className="rounded-full p-1 opacity-55 hover:bg-black/5 hover:opacity-100" aria-label="Tutup pemberitahuan"><X size={16} /></button></div></div>}

      <AssetLibraryModal
        open={Boolean(assetTarget)}
        kind={assetTarget?.kind ?? "image"}
        mode={assetTarget?.target === "manager" ? "manage" : "select"}
        draftId={draftId}
        category={template.category}
        onClose={() => setAssetTarget(null)}
        onSelect={selectLibraryAsset}
      />
      <GoogleLoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} returnTo={draftId ? `/editor/${template.code}/${draftId}` : `/editor/${template.code}`} description={loginReason} />
      <MyInvitationsModal open={isMyInvitationsOpen} onClose={() => setIsMyInvitationsOpen(false)} />
      <InviteCollaboratorModal
        open={isInviteModalOpen}
        draftId={draftId}
        templateCode={template.code}
        collaborators={presence.collaborators}
        owner={presence.owner}
        isOwner={presence.isOwner}
        collaboratorsLoaded={presence.collaboratorsLoaded}
        onRequestCollaborators={presence.requestCollaborators}
        onSendInvite={presence.sendCollaboratorInvite}
        onUpdateRole={presence.updateCollaboratorRole}
        onRemoveCollaborator={presence.removeCollaborator}
        onClose={() => setIsInviteModalOpen(false)}
        onRequireLogin={(reason) => requestLogin(reason)}
      />
      </main>
    </CollaborativeProvider>
  );
}
