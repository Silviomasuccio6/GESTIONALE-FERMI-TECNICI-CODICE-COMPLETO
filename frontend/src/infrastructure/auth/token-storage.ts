const KEY = "fermi_auth";
const REFRESH_KEY = "fermi_refresh";
const REMEMBER_KEY = "fermi_auth_remember";
const CSRF_KEY = "fermi_csrf_token";

export const tokenStorage = {
  get: () => localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY),
  set: (token: string, remember = true) => {
    if (remember) {
      localStorage.setItem(KEY, token);
      localStorage.setItem(REMEMBER_KEY, "1");
      sessionStorage.removeItem(KEY);
      return;
    }
    sessionStorage.setItem(KEY, token);
    sessionStorage.setItem(REMEMBER_KEY, "0");
    localStorage.removeItem(KEY);
  },
  setRefresh: (refreshToken: string, remember = true) => {
    if (remember) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
      sessionStorage.removeItem(REFRESH_KEY);
      return;
    }
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.removeItem(REFRESH_KEY);
  },
  setTokens: (token: string, refreshToken: string, remember = true) => {
    tokenStorage.set(token, remember);
    tokenStorage.setRefresh(refreshToken, remember);
  },
  getCsrf: () => localStorage.getItem(CSRF_KEY) ?? sessionStorage.getItem(CSRF_KEY),
  setCsrf: (csrfToken: string, remember?: boolean) => {
    const shouldRemember = remember ?? (localStorage.getItem(REMEMBER_KEY) ?? sessionStorage.getItem(REMEMBER_KEY) ?? "1") === "1";
    if (shouldRemember) {
      localStorage.setItem(CSRF_KEY, csrfToken);
      sessionStorage.removeItem(CSRF_KEY);
      return;
    }
    sessionStorage.setItem(CSRF_KEY, csrfToken);
    localStorage.removeItem(CSRF_KEY);
  },
  shouldRemember: () => (localStorage.getItem(REMEMBER_KEY) ?? sessionStorage.getItem(REMEMBER_KEY) ?? "1") === "1",
  clear: () => {
    localStorage.removeItem(KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(CSRF_KEY);
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(CSRF_KEY);
  }
};
