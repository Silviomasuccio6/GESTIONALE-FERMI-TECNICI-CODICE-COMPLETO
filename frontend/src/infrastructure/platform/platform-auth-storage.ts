const KEY = "fermi_platform_token";
let inMemoryToken: string | null = null;

const hasSessionStorage = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

export const platformAuthStorage = {
  get: () => {
    if (hasSessionStorage()) return window.sessionStorage.getItem(KEY);
    return inMemoryToken;
  },
  set: (token: string) => {
    if (hasSessionStorage()) {
      window.sessionStorage.setItem(KEY, token);
      return;
    }
    inMemoryToken = token;
  },
  clear: () => {
    if (hasSessionStorage()) {
      window.sessionStorage.removeItem(KEY);
      return;
    }
    inMemoryToken = null;
  }
};
