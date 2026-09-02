"use client";

import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, ChevronDown, Copy, ExternalLink, Eye, FolderOpen, GripVertical, ImagePlus, LayoutPanelTop, Library, LoaderCircle, Maximize2, MessageCircleHeart, MessageSquare, Monitor, Music2, Palette, Plus, Redo2, RotateCw, Save, Search, Send, Settings2, Share2, Smartphone, Sparkles, Type, Undo2, Upload, UserPlus, Users, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { TemplateKit, TemplateSection } from "@/templates/contracts";
import { getTemplateRuntime } from "@/templates/runtime-registry";
import { EDITOR_MESSAGE_SOURCE, isPreviewMessage, type NavigationSource } from "@/templates/navigation/protocol";
import Link from "next/link";
import { EditableField, type EditableTextStyle } from "./components/EditableField";
import { GoogleLoginModal } from "@/components/auth/GoogleLoginModal";
import { UserAuthDropdown } from "@/components/auth/UserAuthDropdown";
import { AssetUploadField } from "./components/AssetUploadField";
import { AssetLibraryModal, type UserAsset } from "./components/AssetLibraryModal";
import { MyInvitationsModal } from "@/components/invitations/MyInvitationsModal";
import { MusicSelectorField } from "./components/MusicSelectorField";
import { stockMusicLibrary } from "@/config/stock-music";
import { makeAdminWhatsAppUrl } from "@/config/contact";
import { PublishModal, type PublishResult } from "./components/PublishModal";
import { useAutoSave } from "./hooks/useAutoSave";
import { AutoSaveStatusBadge } from "./components/AutoSaveStatusBadge";
import { BulkGuestManager } from "./components/BulkGuestManager";
import { InviteCollaboratorModal } from "./components/InviteCollaboratorModal";
import { usePresence } from "@/modules/collaboration/client/usePresence";
import { CollaboratorAvatarStack } from "./collaboration/CollaboratorAvatarStack";
import { CollaborationStatus } from "./collaboration/CollaborationStatus";

type View = "editor" | "generator" | "wishes";
type EditableSection = TemplateSection & { id: string; enabled: boolean };
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

function SortableSectionRow({ section, active, onSelect, onToggle }: { section: EditableSection; active: boolean; onSelect: () => void; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id, disabled: !section.reorderable });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} data-section-id={section.id} style={style} className={`group flex items-center gap-2 rounded-xl border px-2.5 py-2 transition ${active ? "border-emerald-600 bg-emerald-50/70 shadow-sm" : "border-transparent hover:bg-[#f6f0e8]"} ${isDragging ? "z-30 opacity-55 shadow-lg" : ""}`}>
      <button type="button" className={`grid h-7 w-5 place-items-center ${section.reorderable ? "cursor-grab text-[#a49488] active:cursor-grabbing" : "cursor-not-allowed text-[#d5c8bd]"}`} aria-label={`Geser ${section.label}`} disabled={!section.reorderable} {...attributes} {...listeners}>
        <GripVertical size={16} />
      </button>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-xs font-bold text-[#473234]">{section.label}</span>
        <span className="block truncate text-[10px] text-[#95827a]">{section.required ? "Wajib" : "Opsional"}</span>
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

export function ConsoleWorkspace({ template, templatePrice, requestedDraftId = null }: { template: TemplateKit; templatePrice: number; requestedDraftId?: string | null }) {
  const [view, setView] = useState<View>("editor");
  const [sections, setSections] = useState<EditableSection[]>(() => makeSections(template));
  const [selectedId, setSelectedId] = useState(sections[0]?.id ?? "");
  const [themeId, setThemeId] = useState(template.themes[0].id);
  const [musicUrl, setMusicUrl] = useState("/assets/audio/easy-on-me.webm");
  const [musicVolume, setMusicVolume] = useState<number>(0.6);
  const [customThemeColors, setCustomThemeColors] = useState<{ primary?: string; accent?: string; background?: string }>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
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

  // History State for Undo / Redo (max 10 turns)
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryActionRef = useRef(false);

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
  const sectionCounts = useMemo(() => new Map(sections.map((section) => [section.type, (sections.filter((item) => item.type === section.type).length)])), [sections]);
  const previewSections = useMemo(() => sections.map((section) => ({ id: section.id, type: section.type, enabled: section.enabled, data: section.defaultData })), [sections]);
  const previewSettings = useMemo(() => ({ musicUrl, musicVolume, customColors: customThemeColors }), [musicUrl, musicVolume, customThemeColors]);
  const localDraftKey = `undangan-console:local-draft:${template.code}`;

  const filteredSections = useMemo(() => {
    if (!sectionSearchQuery.trim()) return sections;
    const q = sectionSearchQuery.toLowerCase();
    return sections.filter((s) => s.label.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q));
  }, [sections, sectionSearchQuery]);

  // History tracking (Max 10 turns)
  useEffect(() => {
    if (isHistoryActionRef.current) {
      isHistoryActionRef.current = false;
      return;
    }
    const currentSnapshot: HistorySnapshot = {
      sections,
      themeId,
      musicUrl,
      musicVolume,
      customColors: customThemeColors,
    };
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      const nextHistory = [...upToCurrent, currentSnapshot].slice(-10);
      return nextHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 9));
  }, [sections, themeId, musicUrl, musicVolume, customThemeColors]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  function handleUndo() {
    if (!canUndo) return;
    const targetSnapshot = history[historyIndex - 1];
    if (!targetSnapshot) return;
    isHistoryActionRef.current = true;
    setSections(targetSnapshot.sections);
    setThemeId(targetSnapshot.themeId);
    setMusicUrl(targetSnapshot.musicUrl);
    setMusicVolume(typeof targetSnapshot.musicVolume === "number" ? targetSnapshot.musicVolume : 0.6);
    setCustomThemeColors(targetSnapshot.customColors ?? {});
    setHistoryIndex(historyIndex - 1);
  }

  function handleRedo() {
    if (!canRedo) return;
    const targetSnapshot = history[historyIndex + 1];
    if (!targetSnapshot) return;
    isHistoryActionRef.current = true;
    setSections(targetSnapshot.sections);
    setThemeId(targetSnapshot.themeId);
    setMusicUrl(targetSnapshot.musicUrl);
    setMusicVolume(typeof targetSnapshot.musicVolume === "number" ? targetSnapshot.musicVolume : 0.6);
    setCustomThemeColors(targetSnapshot.customColors ?? {});
    setHistoryIndex(historyIndex + 1);
  }

  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y)
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
  }, [canUndo, canRedo, history, historyIndex]);

  useEffect(() => {
    const savedWidth = Number(window.localStorage.getItem(`undangan-console:inspector-width:${template.code}`));
    if (!Number.isFinite(savedWidth) || savedWidth < 280 || savedWidth > 620) return;
    const frame = window.requestAnimationFrame(() => {
      inspectorWidthRef.current = savedWidth;
      setInspectorWidth(savedWidth);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [template.code]);

  useEffect(() => {
    if (view !== "editor") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const applyViewportLock = () => {
      if (media.matches) {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      } else {
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.overflow = previousHtmlOverflow;
      }
    };
    applyViewportLock();
    media.addEventListener("change", applyViewportLock);
    return () => {
      media.removeEventListener("change", applyViewportLock);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [view]);

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
      if (nextStatus === "published" && payload.draft.slug) setPublishUrl(`${window.location.origin}/i/${payload.draft.slug}`);
      if (nextStatus === "custom") {
        setPublishNotice({ tone: "custom", message: customRequestIdentifier ? `Request ${customRequestIdentifier} sedang menunggu proses admin.` : "Request custom sedang menunggu proses admin." });
      } else {
        setPublishNotice(null);
      }
      applyState(payload.draft.themeId, payload.draft.styleOverrides?.musicUrl ?? "/assets/audio/easy-on-me.webm", payload.sections, payload.draft.styleOverrides?.customColors, payload.draft.styleOverrides?.musicVolume);
      return true;
    }

    async function initializeDraft() {
      const localSnapshot = readLocalSnapshot();
      if (!currentUser) {
        setDraftId(null);
        if (localSnapshot) applyState(localSnapshot.themeId, localSnapshot.musicUrl, localSnapshot.sections, localSnapshot.customColors, localSnapshot.musicVolume);
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

  const { status: autoSaveStatus, flush: flushAutoSave } = useAutoSave({
    data: autoSaveData,
    enabled: authResolved && draftReady,
    debounceMs: 1800, // 1.8 detik jeda debounce yang bijak dan umum
    maxWaitMs: 6000,
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
      } finally {
        setIsSaving(false);
      }
    },
    onError: () => {
      setUploadError("Gagal menyimpan perubahan ke server. Periksa koneksi Anda.");
    },
  });

  const presence = usePresence({
    draftId: draftId ?? undefined,
    enabled: Boolean(draftId && currentUser),
    currentUser: currentUser
      ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatarUrl: currentUser.avatarUrl,
        }
      : null,
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
    };
    window.addEventListener("message", receivePreviewMessage);
    return () => window.removeEventListener("message", receivePreviewMessage);
  }, [previewSections, previewSettings, sections, themeId]);

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
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0 || !items[oldIndex].reorderable) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function updateSelected(key: string, value: unknown) {
    if (!selected) return;
    setSections((items) => items.map((section) => section.id === selected.id ? { ...section, defaultData: { ...section.defaultData, [key]: value } } : section));
  }

  function updateSelectedTextStyle(key: string, style: Partial<EditableTextStyle>, replace = false) {
    if (!selected) return;
    setSections((items) => items.map((section) => {
      if (section.id !== selected.id) return section;
      const current = section.defaultData.textStyles && typeof section.defaultData.textStyles === "object" ? section.defaultData.textStyles as Record<string, EditableTextStyle> : {};
      return { ...section, defaultData: { ...section.defaultData, textStyles: { ...current, [key]: replace ? {} : { ...(current[key] ?? {}), ...style } } } };
    }));
  }

  function selectEditorSection(section: EditableSection) {
    setSelectedId(section.id);
    setSectionEditorOpen(true);
    if (!section.enabled) return;
    const navigation: PendingNavigation = { sectionType: section.type, requestId: crypto.randomUUID(), navigationSource: "editor-sidebar" };
    pendingNavigationRef.current = navigation;
    setIsPreviewLoading(true);
    previewFrameRef.current?.contentWindow?.postMessage({ source: EDITOR_MESSAGE_SOURCE, type: "navigate-section", ...navigation }, "*");
  }

  function addSection(definition: TemplateSection) {
    const currentCount = sectionCounts.get(definition.type) ?? 0;
    if (currentCount >= definition.maxInstances) return;
    const next = { ...definition, id: crypto.randomUUID(), enabled: true, defaultData: { ...definition.defaultData } };
    setSections((items) => [...items, next]);
    selectEditorSection(next);
    setIsAddOpen(false);
  }

  async function uploadAsset(file: File, sectionId: string, currentDraftId: string) {
    const form = new FormData();
    form.set("file", file);
    form.set("sectionId", sectionId);
    const response = await fetch(`/api/drafts/${currentDraftId}/assets`, { method: "POST", body: form });
    const payload = await response.json().catch(() => ({ error: "Respons upload tidak valid." }));
    if (!response.ok || !payload.url) throw new Error(payload.error ?? "Upload foto gagal.");
    return { url: payload.url as string, name: file.name };
  }

  async function uploadSelectedImages(files: File[], target: "content" | "background") {
    if (!files.length || !selected || !draftId) return;
    const targetSectionId = selected.id;
    const targetSectionType = selected.type;
    const currentDraftId = draftId;
    const selectedFiles = files.slice(0, targetSectionType === "gallery" && target === "content" ? 4 : 1);
    setUploadError("");
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(selectedFiles.map((file) => uploadAsset(file, targetSectionId, currentDraftId)));
      setSections((items) => items.map((section) => {
        if (section.id !== targetSectionId) return section;
        if (target === "background") return { ...section, defaultData: { ...section.defaultData, backgroundImageUrl: uploaded[0].url, backgroundImageLabel: uploaded[0].name } };
        if (targetSectionType === "gallery") return { ...section, defaultData: { ...section.defaultData, imageLabel: `${uploaded.length} foto galeri`, imageUrls: uploaded.map((asset) => asset.url) } };
        return { ...section, defaultData: { ...section.defaultData, imageLabel: uploaded[0].name, imageUrl: uploaded[0].url } };
      }));
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
      setMusicUrl(uploaded.url);
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
      setMusicUrl(asset.url);
      setAssetTarget(null);
      return;
    }
    setSections((items) => items.map((section) => {
      if (section.id !== target.sectionId) return section;
      if (target.target === "background") return { ...section, defaultData: { ...section.defaultData, backgroundImageUrl: asset.url, backgroundImageLabel: asset.name ?? "Asset Saya" } };
      if (section.type === "gallery") {
        const current = Array.isArray(section.defaultData.imageUrls) ? section.defaultData.imageUrls.filter((url): url is string => typeof url === "string" && Boolean(url)) : [];
        const imageUrls = [...current.filter((url) => url !== asset.url), asset.url].slice(-4);
        return { ...section, defaultData: { ...section.defaultData, imageUrls, imageLabel: `${imageUrls.length} foto galeri` } };
      }
      return { ...section, defaultData: { ...section.defaultData, imageUrl: asset.url, imageLabel: asset.name ?? "Asset Saya" } };
    }));
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
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let invitationPath = `${origin}/i/ayuardi?for=${encodeURIComponent(formattedName)}`;

    if (isPublished && publishUrl) {
      invitationPath = `${publishUrl}${publishUrl.includes("?") ? "&" : "?"}for=${encodeURIComponent(formattedName)}`;
    }

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
    <main className={`${view === "editor" ? "min-h-screen lg:fixed lg:inset-0 lg:flex lg:h-dvh lg:max-h-dvh lg:flex-col lg:overflow-hidden" : "min-h-screen"} bg-slate-50 text-slate-900`}>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:scale-105" title="Kembali ke Beranda">
            <Sparkles size={17} />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-900 leading-tight">Undangan Studio</p>
            <div className="truncate text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
              <span>{template.name} · <span className="font-mono text-slate-600">{template.code}</span></span>
              {draftReady && (
                <>
                  <span className="text-slate-300">·</span>
                  <AutoSaveStatusBadge status={autoSaveStatus} isCloud={Boolean(currentUser)} onRetry={flushAutoSave} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center Tabs: Semibold & Smaller font */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 md:flex shadow-xs">
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
        <div className="flex items-center gap-2">
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

      {view === "editor" && (
        <div className={`editor-workspace-grid grid min-h-[calc(100vh-64px)] grid-cols-1 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:[overflow-anchor:none] ${isInspectorResizing ? "is-resizing" : ""}`} style={{ "--inspector-width": `${inspectorWidth}px` } as CSSProperties}>
          <aside ref={structurePanelRef} className="console-scrollbar max-h-[calc(100vh-64px)] overflow-y-auto overscroll-contain border-b border-slate-200 bg-white p-4 lg:h-full lg:max-h-none lg:border-r lg:border-b-0">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-slate-900">Struktur Undangan</p>
                <p className="mt-0.5 text-[10px] text-slate-500">Geser section untuk mengatur urutan.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {sections.length}
              </span>
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
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-xs font-bold text-slate-800">{section.label}</span>
                        <span className="block truncate text-[10px] text-slate-500">{section.required ? "Wajib" : "Opsional"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSections((items) => items.map((item) => item.id === section.id ? { ...item, enabled: !item.enabled } : item))}
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
                        onSelect={() => selectEditorSection(section)}
                        onToggle={() => setSections((items) => items.map((item) => item.id === section.id ? { ...item, enabled: !item.enabled } : item))}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </aside>

          <section ref={previewPanelRef} className="console-scrollbar relative min-h-[680px] overflow-y-auto overscroll-contain bg-slate-100 p-5 md:p-8 lg:h-full lg:min-h-0 lg:[overflow-anchor:none]">
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
                <button
                  type="button"
                  onClick={() => setZoomScale(1)}
                  title="Reset Zoom ke 100%"
                  className="px-1.5 text-[10px] font-bold text-slate-700 hover:text-emerald-600 transition"
                >
                  {Math.round(zoomScale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.min(1.25, Number((z + 0.1).toFixed(2))))}
                  title="Perbesar Kanvas"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition"
                >
                  <ZoomIn size={13} />
                </button>
              </div>

              {/* Right: Viewport selector */}
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setFrameMode("desktop")}
                  className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition ${
                    frameMode === "desktop"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  title="Viewport desktop"
                >
                  <Monitor size={12} />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFrameMode("ios")}
                  className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition ${
                    frameMode === "ios"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  title="Frame iPhone (Dynamic Island)"
                >
                  <Smartphone size={12} />
                  <span>iOS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFrameMode("android")}
                  className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition ${
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
                  className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition ${
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
              className={`relative mx-auto ${frameMode === "desktop" ? "w-full min-w-[768px] max-w-[1100px]" : "w-[390px] max-w-full"} ${
                frameMode === "desktop"
                  ? "overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_24px_70px_rgba(15,23,42,.16)]"
                  : frameMode === "clean"
                  ? "rounded-2xl border border-slate-300/80 bg-white shadow-xl p-0 overflow-hidden"
                  : frameMode === "ios"
                  ? "bg-[#171719] p-[9px] shadow-[0_24px_70px_rgba(15,23,42,.2)] rounded-[48px] border-[5px] border-[#323235]"
                  : "bg-[#171719] p-[9px] shadow-[0_24px_70px_rgba(15,23,42,.2)] rounded-[30px] border-[3px] border-[#424245]"
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

          <aside ref={inspectorPanelRef} className="console-scrollbar relative min-w-0 max-h-[calc(100vh-64px)] overflow-y-auto overscroll-contain border-t border-slate-200 bg-slate-50 p-3 lg:h-full lg:min-h-0 lg:max-h-none lg:border-t-0 lg:border-l">
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
                </div>
              </div>

              <SidebarAccordion title="Custom Global" subtitle={`${theme.label} · ${musicUrl ? "Musik aktif" : "Tanpa musik"}`} icon={<Palette size={17} />} open={globalEditorOpen} onToggle={() => setGlobalEditorOpen((value) => !value)}>
                <MusicSelectorField
                  musicUrl={musicUrl}
                  volume={musicVolume}
                  disabled={!authResolved || Boolean(currentUser && !draftReady)}
                  onChange={(nextUrl) => {
                    if (!authResolved) return;
                    if (!currentUser) requestLogin("Masuk dengan Google untuk memilih musik undangan.");
                    else if (!draftReady) setUploadError("Draft akun sedang disiapkan. Tunggu sebentar lalu coba lagi.");
                    else setMusicUrl(nextUrl);
                  }}
                  onVolumeChange={(nextVol) => setMusicVolume(nextVol)}
                  onOpenLibrary={() => openAssetLibrary("audio", "music")}
                />
                {uploadError && <p role="alert" className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold leading-4 text-rose-700">{uploadError}</p>}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700">Preset Theme</p>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Global</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {template.themes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setThemeId(item.id);
                          setCustomThemeColors({});
                        }}
                        className={`min-w-0 rounded-xl border p-2.5 text-left transition ${
                          themeId === item.id && !customThemeColors.primary && !customThemeColors.accent && !customThemeColors.background
                            ? "border-emerald-600 bg-emerald-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="mb-2 flex gap-1">
                          {[item.colors.primary, item.colors.accent, item.colors.background].map((color) => (
                            <i key={color} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: color }} />
                          ))}
                        </span>
                        <b className="block truncate text-[10px] text-slate-800">{item.label}</b>
                        <small className="mt-0.5 block truncate text-[8px] text-slate-500">{item.fonts.display}</small>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Palette (Primary, Accent, Background) */}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="mb-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Kustom Warna Tema</p>
                      <p className="text-[10px] text-slate-400">Sesuaikan dengan tema busana/dekorasi</p>
                    </div>
                    {(customThemeColors.primary || customThemeColors.accent || customThemeColors.background) && (
                      <button
                        type="button"
                        onClick={() => setCustomThemeColors({})}
                        className="text-[10px] font-bold text-emerald-700 hover:underline"
                      >
                        Reset ke tema
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* Primary Color */}
                    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] font-bold text-slate-700">
                      <span>Warna Utama (Primary)</span>
                      <span className="flex items-center gap-2">
                        <code className="text-[9px] font-medium text-slate-500">
                          {customThemeColors.primary || theme.colors.primary}
                        </code>
                        <input
                          type="color"
                          value={customThemeColors.primary || theme.colors.primary}
                          onChange={(e) => setCustomThemeColors((prev) => ({ ...prev, primary: e.target.value }))}
                          className="h-7 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                        />
                      </span>
                    </label>

                    {/* Accent Color */}
                    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] font-bold text-slate-700">
                      <span>Warna Aksen (Accent / Gold)</span>
                      <span className="flex items-center gap-2">
                        <code className="text-[9px] font-medium text-slate-500">
                          {customThemeColors.accent || theme.colors.accent}
                        </code>
                        <input
                          type="color"
                          value={customThemeColors.accent || theme.colors.accent}
                          onChange={(e) => setCustomThemeColors((prev) => ({ ...prev, accent: e.target.value }))}
                          className="h-7 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                        />
                      </span>
                    </label>

                    {/* Background Color */}
                    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] font-bold text-slate-700">
                      <span>Warna Latar (Background)</span>
                      <span className="flex items-center gap-2">
                        <code className="text-[9px] font-medium text-slate-500">
                          {customThemeColors.background || theme.colors.background}
                        </code>
                        <input
                          type="color"
                          value={customThemeColors.background || theme.colors.background}
                          onChange={(e) => setCustomThemeColors((prev) => ({ ...prev, background: e.target.value }))}
                          className="h-7 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                        />
                      </span>
                    </label>
                  </div>
                </div>
              </SidebarAccordion>

              <SidebarAccordion title="Custom Section" subtitle={selected ? `${selected.label} · ${selected.fields?.length ?? 0} field` : "Pilih section pada struktur"} icon={<Settings2 size={17} />} open={sectionEditorOpen} onToggle={() => setSectionEditorOpen((value) => !value)}>
                {selected ? <>
                  <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"><div className="min-w-0"><strong className="block truncate text-sm text-slate-800">{selected.label}</strong><small className="block truncate text-[10px] text-slate-500">{selected.description}</small></div><span className={`ml-3 shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold ${selected.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{selected.enabled ? "Tampil" : "Tersembunyi"}</span></div>

                  <div className="space-y-3">
                    {(selected.fields ?? []).map((field) => {
                      const value = typeof selected.defaultData[field.key] === "string" ? String(selected.defaultData[field.key]) : "";
                      const textStyles = selected.defaultData.textStyles && typeof selected.defaultData.textStyles === "object" ? selected.defaultData.textStyles as Record<string, EditableTextStyle> : {};
                      const legacyFonts = selected.defaultData.fontStyles && typeof selected.defaultData.fontStyles === "object" ? selected.defaultData.fontStyles as Record<string, string> : {};
                      const style = textStyles[field.key] ?? (legacyFonts[field.key] ? { fontFamily: legacyFonts[field.key] } : {});
                      return <EditableField key={field.key} field={field} value={value} textStyle={style} onValueChange={(nextValue) => updateSelected(field.key, nextValue)} onTextStyleChange={(nextStyle, replace) => updateSelectedTextStyle(field.key, nextStyle, replace)} />;
                    })}
                  </div>

                  {selected.defaultData.imageLabel !== undefined && (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <AssetUploadField
                        title="Foto komponen"
                        urls={
                          selected.type === "gallery"
                            ? Array.isArray(selected.defaultData.imageUrls)
                              ? selected.defaultData.imageUrls.filter((url): url is string => typeof url === "string")
                              : []
                            : typeof selected.defaultData.imageUrl === "string"
                            ? [selected.defaultData.imageUrl]
                            : []
                        }
                        hint={String(selected.defaultData.imageLabel || "Pilih foto dari Asset Manager")}
                        onOpenLibrary={() => openAssetLibrary("image", "content")}
                        onRemove={(index) => {
                          if (selected.type === "gallery") {
                            const current = Array.isArray(selected.defaultData.imageUrls)
                              ? selected.defaultData.imageUrls.filter((url): url is string => typeof url === "string")
                              : [];
                            const imageUrls = current.filter((_, itemIndex) => itemIndex !== index);
                            updateSelected("imageUrls", imageUrls);
                            updateSelected("imageLabel", imageUrls.length ? `${imageUrls.length} foto galeri` : "");
                          } else {
                            updateSelected("imageUrl", "");
                            updateSelected("imageLabel", "");
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-500">Background section</p><button type="button" onClick={() => updateSelected("backgroundColor", "")} className="text-[9px] font-bold text-emerald-700 hover:underline">Reset warna</button></div>
                    <label className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] font-bold text-slate-700">Warna background<span className="flex items-center gap-2"><code className="text-[9px] font-medium text-slate-500">{typeof selected.defaultData.backgroundColor === "string" && selected.defaultData.backgroundColor ? selected.defaultData.backgroundColor : theme.colors.background}</code><input type="color" value={typeof selected.defaultData.backgroundColor === "string" && selected.defaultData.backgroundColor ? selected.defaultData.backgroundColor : theme.colors.background} onChange={(event) => updateSelected("backgroundColor", event.target.value)} className="h-8 w-9 cursor-pointer rounded-lg border-0 bg-transparent p-0" /></span></label>
                    <AssetUploadField
                      title="Background image"
                      urls={typeof selected.defaultData.backgroundImageUrl === "string" ? [selected.defaultData.backgroundImageUrl] : []}
                      hint={String(selected.defaultData.backgroundImageLabel || "Pilih background dari Asset Manager")}
                      onOpenLibrary={() => openAssetLibrary("image", "background")}
                      onRemove={() => {
                        updateSelected("backgroundImageUrl", "");
                        updateSelected("backgroundImageLabel", "");
                      }}
                    />
                    {uploadError && <p role="alert" className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold leading-4 text-rose-700">{uploadError}</p>}
                  </div>
                </> : <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">Pilih section pada struktur untuk mulai mengedit.</p>}
              </SidebarAccordion>
            </div>
          </aside>

          <button type="button" onClick={() => setIsAddOpen(true)} className="editor-add-section-button fixed bottom-6 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white shadow-[0_12px_30px_rgba(5,150,105,.35)] transition hover:-translate-y-0.5 hover:bg-emerald-700"><Plus size={17} /> Tambah section</button>
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
                    Undangan Aktif & Siap Dibagikan · <span className="font-mono text-[11px] text-emerald-800 font-semibold">{publishUrl || (publishMode === "path" ? `undangan.co/${publishIdentifier}` : `${publishIdentifier}.undangan.co`)}</span>
                  </p>
                </div>
                <a
                  href={publishUrl || `/i/${publishIdentifier}`}
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

      <PublishModal open={isPublishOpen && Boolean(currentUser)} draftId={draftId} draftReady={draftReady} initialIdentifier={publishIdentifier} templatePrice={templatePrice} onClose={() => setIsPublishOpen(false)} onResult={handlePublishResult} />

      {publishNotice && <div className={`fixed left-1/2 top-20 z-[75] w-[min(92vw,620px)] -translate-x-1/2 rounded-2xl border p-4 shadow-[0_20px_60px_rgba(15,23,42,.24)] backdrop-blur ${publishNotice.tone === "success" ? "border-emerald-200 bg-emerald-50/95 text-emerald-950" : "border-amber-200 bg-amber-50/95 text-amber-950"}`} role="alert"><div className="flex items-start gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${publishNotice.tone === "success" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>{publishNotice.tone === "success" ? <Check size={18} /> : <LoaderCircle size={18} />}</span><div className="min-w-0 flex-1"><strong className="block text-sm">{publishNotice.tone === "success" ? "Publish berhasil!" : "Request custom diterima"}</strong><p className="mt-1 text-xs leading-5 opacity-80">{publishNotice.message}</p>{publishNotice.tone === "success" ? <button type="button" onClick={() => { setPublishNotice(null); setView("generator"); }} className="mt-3 rounded-xl bg-emerald-700 px-3 py-2 text-[10px] font-extrabold text-white hover:bg-emerald-800">Buka Generator</button> : <a href={makeAdminWhatsAppUrl(`Halo Admin, saya ingin menindaklanjuti request custom ${publishIdentifier} untuk draft ${draftId ?? "saya"}.`)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-[10px] font-extrabold text-white hover:bg-amber-700">Hubungi admin, klik di sini! <ExternalLink size={12} /></a>}</div><button type="button" onClick={() => setPublishNotice(null)} className="rounded-full p-1 opacity-55 hover:bg-black/5 hover:opacity-100" aria-label="Tutup pemberitahuan"><X size={16} /></button></div></div>}

      {isAddOpen && <div className="fixed inset-0 z-50 bg-[#2c1719]/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="absolute bottom-0 right-0 top-0 w-full max-w-sm overflow-y-auto bg-[#fffcf8] p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a2836d]">Section library</p><h2 className="mt-1 text-xl font-extrabold">Tambah section</h2></div><button type="button" onClick={() => setIsAddOpen(false)} className="rounded-full p-2 text-[#765b5b] hover:bg-[#f4ece5]"><X size={19} /></button></div><div className="space-y-2">{template.sections.map((section) => { const count = sectionCounts.get(section.type) ?? 0; const unavailable = count >= section.maxInstances; return <button key={section.type} type="button" disabled={unavailable || section.required} onClick={() => addSection(section)} className="flex w-full items-start gap-3 rounded-2xl border border-[#eadfd5] p-4 text-left transition enabled:hover:border-emerald-600 enabled:hover:bg-emerald-50/50 disabled:cursor-not-allowed disabled:opacity-50"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">{section.type === "gallery" ? <ImagePlus size={17} /> : <Type size={17} />}</span><span><b className="block text-sm">{section.label}</b><small className="mt-1 block text-[11px] leading-4 text-[#8d7b72]">{section.required ? "Section wajib" : unavailable ? "Batas section tercapai" : section.description}</small></span><Plus className="ml-auto mt-1 text-emerald-600" size={17} /></button>; })}</div></div></div>}
      <AssetLibraryModal
        open={Boolean(assetTarget)}
        kind={assetTarget?.kind ?? "image"}
        mode={assetTarget?.target === "manager" ? "manage" : "select"}
        draftId={draftId}
        onClose={() => setAssetTarget(null)}
        onSelect={selectLibraryAsset}
      />
      <GoogleLoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} returnTo={draftId ? `/editor/${template.code}/${draftId}` : `/editor/${template.code}`} description={loginReason} />
      <MyInvitationsModal open={isMyInvitationsOpen} onClose={() => setIsMyInvitationsOpen(false)} />
      <InviteCollaboratorModal
        open={isInviteModalOpen}
        draftId={draftId}
        templateCode={template.code}
        onClose={() => setIsInviteModalOpen(false)}
        onRequireLogin={(reason) => requestLogin(reason)}
      />
    </main>
  );
}
