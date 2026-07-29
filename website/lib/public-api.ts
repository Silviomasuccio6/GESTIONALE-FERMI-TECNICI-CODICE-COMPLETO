export const COOKIE_CONSENT_STORAGE_KEY =
  "fleetum-cookie-preferences-v1";
export const COOKIE_CONSENT_EVENT = "fleetum:consent-updated";

const visitorStorageKey = "fleetum-public-visitor-v1";
const sessionStorageKey = "fleetum-public-session-v1";
const attributionStorageKey = "fleetum-public-attribution-v1";

export type PublicAttribution = {
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

export type PublicAnalyticsContext = PublicAttribution & {
  visitorId: string;
  sessionId: string;
};

export function getPublicApiBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_API_URL?.trim() ??
    "https://api.fleetum.it/api";
  return configured.replace(/\/+$/, "");
}

export function hasAnalyticsConsent() {
  if (typeof window === "undefined") return false;

  try {
    const stored = window.localStorage.getItem(
      COOKIE_CONSENT_STORAGE_KEY,
    );
    return stored ? Boolean(JSON.parse(stored)?.analytics) : false;
  } catch {
    return false;
  }
}

export function isDoNotTrackEnabled() {
  if (typeof navigator === "undefined") return false;
  return (
    navigator.doNotTrack === "1" ||
    (window as Window & { doNotTrack?: string }).doNotTrack === "1"
  );
}

function newTrackingId() {
  return (
    crypto.randomUUID?.() ??
    `fleetum-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function getOrCreateStorageId(
  storage: Storage,
  key: string,
) {
  const existing = storage.getItem(key);
  if (existing) return existing;

  const created = newTrackingId();
  storage.setItem(key, created);
  return created;
}

function safeReferrer() {
  if (!document.referrer) return undefined;

  try {
    return new URL(document.referrer).origin;
  } catch {
    return undefined;
  }
}

function currentAttribution(): PublicAttribution {
  const url = new URL(window.location.href);
  const current = {
    utmSource: url.searchParams.get("utm_source") || undefined,
    utmMedium: url.searchParams.get("utm_medium") || undefined,
    utmCampaign: url.searchParams.get("utm_campaign") || undefined,
    utmContent: url.searchParams.get("utm_content") || undefined,
    utmTerm: url.searchParams.get("utm_term") || undefined,
  };

  if (Object.values(current).some(Boolean)) {
    try {
      window.sessionStorage.setItem(
        attributionStorageKey,
        JSON.stringify(current),
      );
    } catch {
      // Attribution remains available for the current request only.
    }
    return { referrer: safeReferrer(), ...current };
  }

  try {
    const stored = window.sessionStorage.getItem(
      attributionStorageKey,
    );
    const attribution = stored
      ? (JSON.parse(stored) as Omit<PublicAttribution, "referrer">)
      : {};
    return { referrer: safeReferrer(), ...attribution };
  } catch {
    return { referrer: safeReferrer() };
  }
}

export function getConsentedPublicAnalyticsContext():
  | PublicAnalyticsContext
  | undefined {
  if (
    typeof window === "undefined" ||
    !hasAnalyticsConsent() ||
    isDoNotTrackEnabled()
  ) {
    return undefined;
  }

  try {
    return {
      ...currentAttribution(),
      visitorId: getOrCreateStorageId(
        window.localStorage,
        visitorStorageKey,
      ),
      sessionId: getOrCreateStorageId(
        window.sessionStorage,
        sessionStorageKey,
      ),
    };
  } catch {
    return undefined;
  }
}
