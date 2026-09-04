import type { TemplateNavigationAdapter } from "./contracts";
import type { NavigationSource } from "./protocol";

type NavigationEvent = "navigation-start" | "navigation-complete" | "navigation-cancelled";

type NavigationManagerOptions = {
  adapter: TemplateNavigationAdapter;
  onActiveSection: (sectionId: string) => void;
  onNavigationEvent: (type: NavigationEvent, sectionId: string, requestId: string) => void;
};

export class PreviewNavigationManager {
  private frame = 0;
  private navigationToken = 0;
  private activeSection = "";
  private programmatic = false;
  private root: HTMLElement | null = null;
  private currentRequest: { sectionId: string; requestId: string } | null = null;
  private rootObserver: ResizeObserver | null = null;
  private domObserver: MutationObserver | null = null;

  constructor(private readonly options: NavigationManagerOptions) {}

  start() {
    this.attachScrollRoot();
    // scroll does not bubble, but capture catches a nested template scroll root
    // even when a template mounts or swaps its root after hydration.
    document.addEventListener("scroll", this.scheduleActiveSection, true);
    window.addEventListener("resize", this.scheduleActiveSection);
    this.scheduleActiveSection();
  }

  destroy() {
    this.detachScrollRoot();
    document.removeEventListener("scroll", this.scheduleActiveSection, true);
    window.removeEventListener("resize", this.scheduleActiveSection);
    if (this.frame) window.cancelAnimationFrame(this.frame);
    this.navigationToken += 1;
  }

  async navigate(sectionId: string, requestId: string, _source: NavigationSource) {
    const token = ++this.navigationToken;
    this.programmatic = true;
    this.currentRequest = { sectionId, requestId };
    this.options.onNavigationEvent("navigation-start", sectionId, requestId);
    await this.options.adapter.prepareSection(sectionId);

    for (let attempt = 0; attempt < 30; attempt += 1) {
      if (token !== this.navigationToken) return;
      if (this.options.adapter.getSectionElement(sectionId) && this.options.adapter.isSectionReady(sectionId)) break;
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    }

    if (token !== this.navigationToken) return;
    const root = this.options.adapter.getScrollRoot();
    const destination = this.options.adapter.getSectionElement(sectionId);
    if (!root || !destination) {
      this.programmatic = false;
      this.currentRequest = null;
      this.options.onNavigationEvent("navigation-cancelled", sectionId, requestId);
      return;
    }

    const openingId = this.options.adapter.getOpeningSectionId();
    let targetTop = 0;
    if (sectionId !== openingId) {
      if (destination.parentElement === root && typeof destination.offsetTop === "number") {
        targetTop = destination.offsetTop;
      } else {
        targetTop = destination.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
      }
    }
    const behavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    const completed = await this.animateScroll(root, Math.max(0, targetTop), token);
    root.style.scrollBehavior = behavior;

    if (!completed || token !== this.navigationToken) return;
    this.activeSection = sectionId;
    this.programmatic = false;
    this.currentRequest = null;
    this.options.onActiveSection(sectionId);
    this.options.onNavigationEvent("navigation-complete", sectionId, requestId);
  }

  private cancelOnUserInput = () => {
    if (!this.programmatic) return;
    const request = this.currentRequest;
    this.navigationToken += 1;
    this.programmatic = false;
    this.currentRequest = null;
    if (request) this.options.onNavigationEvent("navigation-cancelled", request.sectionId, request.requestId);
  };

  private animateScroll(root: HTMLElement, target: number, token: number) {
    const start = root.scrollTop;
    const distance = target - start;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || Math.abs(distance) < 3) {
      root.scrollTop = target;
      return Promise.resolve(true);
    }

    const duration = Math.min(520, Math.max(280, Math.abs(distance) * 0.09));
    return new Promise<boolean>((resolve) => {
      const startedAt = performance.now();
      const tick = (now: number) => {
        if (token !== this.navigationToken) {
          resolve(false);
          return;
        }
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        root.scrollTop = start + distance * eased;
        if (progress < 1) window.requestAnimationFrame(tick);
        else resolve(true);
      };
      window.requestAnimationFrame(tick);
    });
  }

  private scheduleActiveSection = () => {
    if (this.frame) return;
    this.frame = window.requestAnimationFrame(() => {
      this.frame = 0;
      this.attachScrollRoot();
      if (this.programmatic) return;
      const current = this.detectActiveSection();
      if (!current || current === this.activeSection) return;
      this.activeSection = current;
      this.options.onActiveSection(current);
    });
  };

  private attachScrollRoot() {
    const nextRoot = this.options.adapter.getScrollRoot();
    if (nextRoot === this.root) return;

    this.detachScrollRoot();
    this.root = nextRoot;
    if (!this.root) return;

    this.root.addEventListener("scroll", this.scheduleActiveSection, { passive: true });
    this.root.addEventListener("wheel", this.cancelOnUserInput, { passive: true });
    this.root.addEventListener("touchstart", this.cancelOnUserInput, { passive: true });
    this.rootObserver = new ResizeObserver(this.scheduleActiveSection);
    this.rootObserver.observe(this.root);
    this.domObserver = new MutationObserver(this.scheduleActiveSection);
    this.domObserver.observe(this.root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "class", "style", "data-template-section"],
    });
  }

  private detachScrollRoot() {
    this.root?.removeEventListener("scroll", this.scheduleActiveSection);
    this.root?.removeEventListener("wheel", this.cancelOnUserInput);
    this.root?.removeEventListener("touchstart", this.cancelOnUserInput);
    this.rootObserver?.disconnect();
    this.rootObserver = null;
    this.domObserver?.disconnect();
    this.domObserver = null;
    this.root = null;
  }

  private detectActiveSection() {
    const openingId = this.options.adapter.getOpeningSectionId();
    if (openingId) {
      const opening = this.options.adapter.getSectionElement(openingId);
      if (opening && opening.getClientRects().length && getComputedStyle(opening).visibility !== "hidden") return openingId;
    }

    const root = this.options.adapter.getScrollRoot();
    if (!root) return null;
    const rootRect = root.getBoundingClientRect();
    const marker = rootRect.top + root.clientHeight * 0.36;
    const candidates = this.options.adapter
      .getSectionEntries()
      .filter(({ id, element }) => id !== openingId && element.getClientRects().length)
      .map((entry) => ({ ...entry, rect: entry.element.getBoundingClientRect() }));

    if (!candidates.length) return null;

    // 1. Native Hit Testing: Check topmost element at the marker point.
    // Handles sticky sections, stacking cards, and custom stacking orders flawlessly.
    const centerX = rootRect.left + root.clientWidth / 2;
    const hit = document.elementFromPoint(centerX, marker);
    const hitSection = hit?.closest<HTMLElement>("[data-template-section]");
    if (hitSection?.dataset.templateSection) {
      const matched = candidates.find((c) => c.id === hitSection.dataset.templateSection);
      if (matched) return matched.id;
    }

    // 2. Geometry Fallback:
    // When multiple sections contain the marker (e.g. sticky stacked cards of equal height),
    // the one with higher DOM index (later in candidates) is rendered on top.
    const containing = candidates
      .filter(({ rect }) => rect.top <= marker && rect.bottom > marker)
      .sort((a, b) => {
        if (Math.abs(a.rect.height - b.rect.height) > 20) {
          return a.rect.height - b.rect.height;
        }
        return candidates.indexOf(b) - candidates.indexOf(a);
      });
    if (containing[0]) return containing[0].id;

    const passed = candidates.filter(({ rect }) => rect.top <= marker).sort((a, b) => b.rect.top - a.rect.top);
    return passed[0]?.id ?? candidates.sort((a, b) => Math.abs(a.rect.top - marker) - Math.abs(b.rect.top - marker))[0]?.id ?? null;
  }
}
