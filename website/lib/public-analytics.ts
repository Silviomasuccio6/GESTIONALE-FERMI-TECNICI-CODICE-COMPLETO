import {
  COOKIE_CONSENT_EVENT,
  getConsentedPublicAnalyticsContext,
  getPublicApiBaseUrl,
  hasAnalyticsConsent,
  isDoNotTrackEnabled,
} from "./public-api";

export type FleetumEventName =
  | "page_view"
  | "hero_cta_click"
  | "product_tour_start"
  | "product_tour_step"
  | "product_tour_complete"
  | "pricing_view"
  | "plan_select"
  | "roi_calculated"
  | "form_start"
  | "form_step_complete";

type MetadataValue = string | number | boolean | null;
type EventMetadata = Record<string, MetadataValue>;

type PublicAnalyticsEventType =
  | "PAGE_VIEW"
  | "CTA_CLICK"
  | "DEMO_FORM_VIEW"
  | "PRICING_VIEW";

let pendingPageView: EventMetadata | undefined;
let consentListenerBound = false;
let lastPageFingerprint = "";
let lastPageViewAt = 0;

function backendEventType(
  eventName: FleetumEventName,
): PublicAnalyticsEventType {
  if (eventName === "page_view") return "PAGE_VIEW";
  if (eventName === "pricing_view") return "PRICING_VIEW";
  if (eventName === "form_start") return "DEMO_FORM_VIEW";
  return "CTA_CLICK";
}

function sanitizeMetadata(
  eventName: FleetumEventName,
  metadata?: EventMetadata,
) {
  return Object.fromEntries(
    Object.entries({ action: eventName, ...metadata }).slice(0, 20),
  );
}

function sendPublicEvent(
  eventName: FleetumEventName,
  metadata?: EventMetadata,
) {
  const context = getConsentedPublicAnalyticsContext();
  if (!context) return;

  const payload = {
    eventType: backendEventType(eventName),
    path: window.location.pathname,
    ...context,
    consentAnalytics: true,
    metadata: sanitizeMetadata(eventName, metadata),
  };
  const url = `${getPublicApiBaseUrl()}/public/analytics/event`;
  const body = JSON.stringify(payload);

  if (typeof navigator.sendBeacon === "function") {
    const sent = navigator.sendBeacon(
      url,
      new Blob([body], { type: "application/json" }),
    );
    if (sent) return;
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics must never block navigation or public forms.
  });
}

function bindConsentListener() {
  if (consentListenerBound) return;
  consentListenerBound = true;

  window.addEventListener(COOKIE_CONSENT_EVENT, () => {
    if (!pendingPageView || !hasAnalyticsConsent()) return;
    const queued = pendingPageView;
    pendingPageView = undefined;
    sendPublicEvent("page_view", queued);
  });
}

export function trackPublicEvent(
  eventName: FleetumEventName,
  metadata?: EventMetadata,
) {
  if (
    typeof window === "undefined" ||
    isDoNotTrackEnabled()
  ) {
    return;
  }

  if (!hasAnalyticsConsent()) {
    if (eventName === "page_view") {
      pendingPageView = metadata ?? {};
      bindConsentListener();
    }
    return;
  }

  if (eventName === "page_view" || eventName === "pricing_view") {
    const fingerprint = `${eventName}:${window.location.pathname}`;
    const now = Date.now();
    if (
      fingerprint === lastPageFingerprint &&
      now - lastPageViewAt < 1200
    ) {
      return;
    }
    lastPageFingerprint = fingerprint;
    lastPageViewAt = now;
  }

  sendPublicEvent(eventName, metadata);
}
