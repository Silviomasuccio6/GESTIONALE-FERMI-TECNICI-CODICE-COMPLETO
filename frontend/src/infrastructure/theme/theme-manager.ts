export type ThemeMode = "light" | "dark";

const themeStorageKey = "fermi_theme_mode";

export const getStoredTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(themeStorageKey);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const applyTheme = (theme: ThemeMode) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export const setTheme = (theme: ThemeMode) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(themeStorageKey, theme);
  }
  applyTheme(theme);
};

export const initTheme = (): ThemeMode => {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
};
