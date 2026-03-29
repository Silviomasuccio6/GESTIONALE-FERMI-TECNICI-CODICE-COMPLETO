import axios from "axios";
import { snackbar } from "../../application/stores/snackbar-store";
import { useAuthStore } from "../../application/stores/auth-store";
import { ApiRepository } from "../../domain/repositories/api-repository";
import { tokenStorage } from "../auth/token-storage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  timeout: 15000
});
let lastToastAt = 0;
const TOAST_COOLDOWN_MS = 5000;
const AUTH_ROUTES = ["/auth/login", "/auth/signup", "/auth/forgot-password", "/auth/reset-password", "/auth/accept-invite", "/auth/refresh"];

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config ?? {};
    const status = error.response?.status as number | undefined;
    const apiErrorCode = error.response?.data?.error as string | undefined;
    const apiMessage = error.response?.data?.message as string | undefined;
    const apiDetails = error.response?.data?.details as Record<string, unknown> | undefined;
    const requestUrl = String(originalRequest.url ?? "");
    const isAuthRoute = AUTH_ROUTES.some((route) => requestUrl.startsWith(route));

    const licenseMessage =
      apiErrorCode === "LICENSE_EXPIRED"
        ? "Licenza scaduta. Rinnova per continuare."
        : apiErrorCode === "LICENSE_SUSPENDED"
          ? "Licenza sospesa. Contatta il supporto."
          : apiErrorCode === "TENANT_INACTIVE"
            ? "Tenant disattivato. Contatta l'amministratore."
            : null;

    const planLimitMessage =
      apiErrorCode === "PLAN_LIMIT"
        ? `${apiMessage ?? "Funzionalità non inclusa nel tuo piano."}${apiDetails?.requiredPlan ? ` (Piano richiesto: ${String(apiDetails.requiredPlan)})` : ""}`
        : null;

    const isNetwork = error.code === "ERR_NETWORK";

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      const refreshToken = tokenStorage.getRefresh();
      if (refreshToken) {
        try {
          originalRequest._retry = true;
          const refreshRes = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"}/auth/refresh`,
            { refreshToken },
            { timeout: 15000 }
          );
          const nextToken = refreshRes.data?.token as string | undefined;
          const nextRefresh = refreshRes.data?.refreshToken as string | undefined;
          const nextUser = refreshRes.data?.user;

          if (nextToken && nextRefresh) {
            const remember = tokenStorage.shouldRemember();
            tokenStorage.setTokens(nextToken, nextRefresh, remember);
            if (nextUser) useAuthStore.getState().setSession(nextToken, nextUser, remember, nextRefresh);
            else useAuthStore.setState({ token: nextToken });
            originalRequest.headers = { ...(originalRequest.headers ?? {}), Authorization: `Bearer ${nextToken}` };
            return api.request(originalRequest);
          }
        } catch {
          tokenStorage.clear();
          useAuthStore.getState().logout();
          if (window.location.pathname !== "/login") window.location.href = "/login";
        }
      }
    }

    const message =
      planLimitMessage ||
      licenseMessage ||
      apiMessage ||
      (status === 402 ? "Licenza scaduta. Rinnova per continuare." : null) ||
      (status === 403 ? "Accesso non consentito." : null) ||
      (isNetwork ? "Backend non raggiungibile. Verifica API e connessione." : "Errore di rete");

    const now = Date.now();
    if (now - lastToastAt > TOAST_COOLDOWN_MS) {
      snackbar.error(message);
      lastToastAt = now;
    }
    return Promise.reject(new Error(message));
  }
);

const shouldShowSuccess = (url: string) => {
  const ignore = ["/auth/login", "/auth/signup", "/auth/forgot-password", "/auth/reset-password", "/auth/accept-invite", "/auth/change-password"];
  return !ignore.some((x) => url.startsWith(x));
};

export const httpClient: ApiRepository = {
  async get<T>(url: string, params?: Record<string, string | number | undefined>) {
    const res = await api.get<T>(url, { params });
    return res.data;
  },
  async post<T>(url: string, body?: unknown, headers?: Record<string, string>) {
    const res = await api.post<T>(url, body, { headers });
    if (shouldShowSuccess(url)) snackbar.success("Operazione completata");
    return res.data;
  },
  async put<T>(url: string, body?: unknown) {
    const res = await api.put<T>(url, body);
    if (shouldShowSuccess(url)) snackbar.success("Impostazioni salvate");
    return res.data;
  },
  async patch<T>(url: string, body?: unknown) {
    const res = await api.patch<T>(url, body);
    if (shouldShowSuccess(url)) snackbar.success("Modifica salvata");
    return res.data;
  },
  async delete(url: string) {
    await api.delete(url);
    if (shouldShowSuccess(url)) snackbar.success("Eliminazione completata");
  }
};
