const KEY = "fermi_auth";
const REFRESH_KEY = "fermi_refresh";
const REMEMBER_KEY = "fermi_auth_remember";
const CSRF_KEY = "fermi_csrf_token";

const getStorage = (kind: "local" | "session"): Storage | null => {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
};

const safeGetItem = (kind: "local" | "session", key: string) => {
  const storage = getStorage(kind);
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (kind: "local" | "session", key: string, value: string) => {
  const storage = getStorage(kind);
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore quota/security errors and keep app usable.
  }
};

const safeRemoveItem = (kind: "local" | "session", key: string) => {
  const storage = getStorage(kind);
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore quota/security errors and keep app usable.
  }
};

export const tokenStorage = {
  get: () => safeGetItem("local", KEY) ?? safeGetItem("session", KEY),
  getRefresh: () => safeGetItem("local", REFRESH_KEY) ?? safeGetItem("session", REFRESH_KEY),
  set: (token: string, remember = true) => {
    if (remember) {
      safeSetItem("local", KEY, token);
      safeSetItem("local", REMEMBER_KEY, "1");
      safeRemoveItem("session", KEY);
      return;
    }
    safeSetItem("session", KEY, token);
    safeSetItem("session", REMEMBER_KEY, "0");
    safeRemoveItem("local", KEY);
  },
  setRefresh: (refreshToken: string, remember = true) => {
    if (remember) {
      safeSetItem("local", REFRESH_KEY, refreshToken);
      safeRemoveItem("session", REFRESH_KEY);
      return;
    }
    safeSetItem("session", REFRESH_KEY, refreshToken);
    safeRemoveItem("local", REFRESH_KEY);
  },
  setTokens: (token: string, refreshToken: string, remember = true) => {
    tokenStorage.set(token, remember);
    tokenStorage.setRefresh(refreshToken, remember);
  },
  getCsrf: () => safeGetItem("local", CSRF_KEY) ?? safeGetItem("session", CSRF_KEY),
  setCsrf: (csrfToken: string, remember?: boolean) => {
    const shouldRemember = remember ?? (safeGetItem("local", REMEMBER_KEY) ?? safeGetItem("session", REMEMBER_KEY) ?? "1") === "1";
    if (shouldRemember) {
      safeSetItem("local", CSRF_KEY, csrfToken);
      safeRemoveItem("session", CSRF_KEY);
      return;
    }
    safeSetItem("session", CSRF_KEY, csrfToken);
    safeRemoveItem("local", CSRF_KEY);
  },
  shouldRemember: () => (safeGetItem("local", REMEMBER_KEY) ?? safeGetItem("session", REMEMBER_KEY) ?? "1") === "1",
  clear: () => {
    safeRemoveItem("local", KEY);
    safeRemoveItem("local", REFRESH_KEY);
    safeRemoveItem("local", REMEMBER_KEY);
    safeRemoveItem("local", CSRF_KEY);
    safeRemoveItem("session", KEY);
    safeRemoveItem("session", REFRESH_KEY);
    safeRemoveItem("session", REMEMBER_KEY);
    safeRemoveItem("session", CSRF_KEY);
  }
};
