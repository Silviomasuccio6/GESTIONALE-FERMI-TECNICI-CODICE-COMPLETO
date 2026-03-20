import { httpClient } from "../../infrastructure/api/http-client";
import { tokenStorage } from "../../infrastructure/auth/token-storage";

export const statsUseCases = {
  dashboard: () => httpClient.get<any>("/stats/dashboard"),
  analytics: (params?: Record<string, string | number | undefined>) => httpClient.get<any>("/stats/analytics", params),
  workshopsHealth: (params?: Record<string, string | number | undefined>) => httpClient.get<{ data: any[] }>("/stats/workshops/health", params),
  workshopsCapacity: (params?: Record<string, string | number | undefined>) => httpClient.get<{ data: any[] }>("/stats/workshops/capacity", params),
  teamPerformance: (params?: Record<string, string | number | undefined>) => httpClient.get<{ data: any[] }>("/stats/team/performance", params),
  aiSuggestions: () => httpClient.get<{ data: any[] }>("/stats/ai/suggestions"),
  downloadAnalyticsCsv: async (params?: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}` !== "") query.set(key, String(value));
    });
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
    const token = tokenStorage.get();
    const response = await fetch(`${base}/stats/analytics/export.csv?${query.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) {
      try {
        const payload = await response.json();
        throw new Error(payload?.message || "Download report fallito");
      } catch {
        throw new Error("Download report fallito");
      }
    }
    return response.blob();
  }
};
