export type ThemeMode = "light" | "dark";

const themeStorageKey = "fermi_theme_mode";

const safeGetStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const getStoredTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const stored = (() => {
    const storage = safeGetStorage();
    if (!storage) return null;
    try {
      return storage.getItem(themeStorageKey);
    } catch {
      return null;
    }
  })();
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const applyTheme = (theme: ThemeMode) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export const setTheme = (theme: ThemeMode) => {
  const storage = safeGetStorage();
  if (storage) {
    try {
      storage.setItem(themeStorageKey, theme);
    } catch {
      // Ignore storage failures and still apply theme in memory.
    }
  }
  applyTheme(theme);
};

export const initTheme = (): ThemeMode => {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
};
