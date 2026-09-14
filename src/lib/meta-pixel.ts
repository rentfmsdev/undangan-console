export type MetaPixelEvent = "Contact" | "InitiateCheckout" | "Lead" | "PageView" | "ViewContent";

type MetaPixelParameters = Record<string, boolean | number | string | undefined>;

type FacebookPixel = (command: "track", event: MetaPixelEvent, parameters?: MetaPixelParameters) => void;
type QueuedEvent = { event: MetaPixelEvent; parameters?: MetaPixelParameters };

const queuedEvents: QueuedEvent[] = [];

declare global {
  interface Window {
    fbq?: FacebookPixel;
  }
}

export function getMetaPixelId() {
  const pixelId = typeof document !== "undefined" ? document.documentElement.dataset.metaPixelId : undefined;
  return pixelId && /^\d+$/.test(pixelId) ? pixelId : null;
}

export function trackMetaPixel(event: MetaPixelEvent, parameters?: MetaPixelParameters) {
  if (typeof window === "undefined") return;
  if (!getMetaPixelId() || typeof window.fbq !== "function") {
    if (queuedEvents.length < 25) queuedEvents.push({ event, parameters });
    return;
  }

  window.fbq("track", event, parameters);
}

export function flushMetaPixelEvents() {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  while (queuedEvents.length) {
    const queuedEvent = queuedEvents.shift();
    if (queuedEvent) window.fbq("track", queuedEvent.event, queuedEvent.parameters);
  }
}
