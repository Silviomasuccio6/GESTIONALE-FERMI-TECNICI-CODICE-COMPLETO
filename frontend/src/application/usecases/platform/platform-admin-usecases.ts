import { platformAuthStorage } from "../../../infrastructure/platform/platform-auth-storage";

const apiBase = import.meta.env.VITE_PLATFORM_API_BASE_URL || "http://127.0.0.1:4100/platform-api";

type PlatformApiError = Error & { status?: number; code?: string };

const authHeaders = () => {
  const token = platformAuthStorage.get();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export type LicenseStatus = "ACTIVE" | "SUSPENDED" | "EXPIRED" | "TRIAL";
export type QuickAction =
  | "ACTIVATE_LICENSE"
  | "SUSPEND_LICENSE"
  | "RENEW_30_DAYS"
  | "RENEW_365_DAYS"
  | "DEACTIVATE_TENANT"
  | "REACTIVATE_TENANT";

export type PlatformRevenueMetrics = {
  selectedMonth: string;
  previousMonth: string;
  planPricing: Record<"STARTER" | "PRO" | "ENTERPRISE", number>;
  assumptions: {
    formula: string;
    seatsFactorRule: string;
    billingCycleRule: string;
  };
  kpis: {
    mrrTotal: number;
    mrrLost: number;
    deltaFromPrevious: number;
    tenantsByPlan: Record<"STARTER" | "PRO" | "ENTERPRISE", number>;
    mrrByPlan: Record<"STARTER" | "PRO" | "ENTERPRISE", number>;
  };
  breakdown: Array<{
    plan: "STARTER" | "PRO" | "ENTERPRISE";
    basePrice: number;
    activeTenants: number;
    totalTenants: number;
    seatsTotal: number;
    estimatedRevenue: number;
  }>;
  trend: Array<{
    month: string;
    mrrTotal: number;
    mrrLost: number;
  }>;
};

const toPlatformError = (response: Response, payload: any, fallback: string): PlatformApiError => {
  const error = new Error(payload?.message || fallback) as PlatformApiError;
  error.status = response.status;
  if (payload?.code) error.code = String(payload.code);
  return error;
};

const throwIfNotOk = async (response: Response, fallback: string) => {
  if (response.ok) return;
  const payload = await response.json().catch(() => null);
  throw toPlatformError(response, payload, fallback);
};

export const platformAdminUseCases = {
  login: async (input: { email: string; password: string }) => {
    const response = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const data = await response.json();
    if (!response.ok) throw toPlatformError(response, data, "Login platform fallito");
    platformAuthStorage.set(data.token);
    return data;
  },
  logout: () => platformAuthStorage.clear(),
  listTenants: async () => {
    const response = await fetch(`${apiBase}/tenants`, { headers: { ...authHeaders() } });
    const data = await response.json();
    if (!response.ok) throw toPlatformError(response, data, "Impossibile caricare tenant");
    return data as { data: any[] };
  },
  listUsers: async () => {
    const response = await fetch(`${apiBase}/users`, { headers: { ...authHeaders() } });
    const data = await response.json();
    if (!response.ok) throw toPlatformError(response, data, "Impossibile caricare utenti");
    return data as { data: any[] };
  },
  listRecentEvents: async (limit = 20) => {
    const response = await fetch(`${apiBase}/events/recent?limit=${limit}`, { headers: { ...authHeaders() } });
    const data = await response.json();
    if (!response.ok) throw toPlatformError(response, data, "Impossibile caricare eventi recenti");
    return data as { data: any[] };
  },
  revenueMetrics: async (input?: { month?: string; months?: number }) => {
    const query = new URLSearchParams();
    if (input?.month) query.set("month", input.month);
    if (input?.months) query.set("months", String(input.months));
    const response = await fetch(`${apiBase}/metrics/revenue?${query.toString()}`, { headers: { ...authHeaders() } });
    const data = await response.json();
    if (!response.ok) throw toPlatformError(response, data, "Impossibile caricare report ricavi");
    return data as PlatformRevenueMetrics;
  },
  revenueCsv: async (input?: { month?: string; months?: number }) => {
    const query = new URLSearchParams();
    if (input?.month) query.set("month", input.month);
    if (input?.months) query.set("months", String(input.months));
    const response = await fetch(`${apiBase}/metrics/revenue/export.csv?${query.toString()}`, {
      headers: { ...authHeaders() }
    });
    await throwIfNotOk(response, "Export CSV ricavi fallito");
    return response.blob();
  },
  updateLicense: async (
    tenantId: string,
    payload: {
      plan: string;
      seats: number;
      status: LicenseStatus;
      expiresAt?: string | null;
      priceMonthly?: number | null;
      billingCycle?: "monthly" | "yearly";
    }
  ) => {
    const response = await fetch(`${apiBase}/tenants/${tenantId}/license`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw toPlatformError(response, data, "Aggiornamento licenza fallito");
    return data;
  },
  updateTenantStatus: async (tenantId: string, isActive: boolean) => {
    const response = await fetch(`${apiBase}/tenants/${tenantId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ isActive })
    });
    const data = await response.json();
    if (!response.ok) throw toPlatformError(response, data, "Aggiornamento stato tenant fallito");
    return data;
  },
  quickAction: async (tenantId: string, action: QuickAction) => {
    const response = await fetch(`${apiBase}/tenants/${tenantId}/quick-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ action })
    });
    const data = await response.json();
    if (!response.ok) throw toPlatformError(response, data, "Azione rapida fallita");
    return data;
  }
};
