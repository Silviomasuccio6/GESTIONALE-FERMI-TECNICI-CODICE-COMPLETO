import { tokenStorage } from "../../infrastructure/auth/token-storage";

export const notificationsUseCases = {
  inbox: async () => {
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
    const token = tokenStorage.get();
    const response = await fetch(`${base}/notifications/inbox`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) throw new Error("Impossibile caricare notifiche");
    return response.json() as Promise<{ data: any[] }>;
  },
  streamUrl: () => {
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
    const token = tokenStorage.get();
    const query = token ? `?access_token=${encodeURIComponent(token)}` : "";
    return `${base}/notifications/stream${query}`;
  }
};
