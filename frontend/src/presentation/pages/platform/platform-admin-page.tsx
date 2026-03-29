import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  Clock3,
  Menu,
  RefreshCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
  XCircle,
  Zap
} from "lucide-react";
import {
  LicenseStatus,
  platformAdminUseCases,
  PlatformRevenueMetrics,
  QuickAction
} from "../../../application/usecases/platform/platform-admin-usecases";
import { snackbar } from "../../../application/stores/snackbar-store";
import { PageHeader } from "../../components/layout/page-header";
import { PlatformEventItem } from "../../components/platform/platform-event-item";
import { PlatformKpiCard } from "../../components/platform/platform-kpi-card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useNavigate } from "react-router-dom";
import {
  buildPlanUpdatePayload,
  canApplyPlanAndActivate,
  canApplyPlanChange,
  clearPlanDraft,
  hasPlanChange,
  isPlanDowngrade,
  isPlanTier,
  normalizePlanTier,
  PLAN_TIERS,
  PlanTier,
  rollbackPlanDraft
} from "./platform-plan-actions";

type TenantRow = {
  id: string;
  name: string;
  owner: { firstName: string; lastName: string; email: string } | null;
  isActive: boolean;
  usersCount?: number;
  vehiclesCount?: number;
  license?: {
    plan?: string;
    seats?: number;
    status?: LicenseStatus;
    expiresAt?: string | null;
    priceMonthly?: number | null;
    billingCycle?: "monthly" | "yearly";
  };
};

type EventRow = {
  id: string;
  action: string;
  tenantName: string;
  createdAt: string;
  details?: unknown;
};

type PlatformUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  tenant?: { name?: string } | null;
};

type ConfirmState = {
  tenantId: string;
  tenantName: string;
  action: QuickAction;
  title: string;
  description: string;
} | null;

type PlanConfirmState = {
  tenant: TenantRow;
  nextPlan: PlanTier;
  forceActivate: boolean;
} | null;

type PlatformSectionId = "overview" | "clients" | "revenue" | "events" | "tools";

type PlatformNavGroup = {
  id: string;
  label: string;
  items: Array<{ id: PlatformSectionId; label: string }>;
};

const actionLabels: Record<QuickAction, string> = {
  ACTIVATE_LICENSE: "Attiva licenza",
  SUSPEND_LICENSE: "Sospendi licenza",
  RENEW_30_DAYS: "Rinnova +30 giorni",
  RENEW_365_DAYS: "Rinnova +365 giorni",
  DEACTIVATE_TENANT: "Disattiva tenant",
  REACTIVATE_TENANT: "Riattiva tenant"
};

const platformNavGroups: PlatformNavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard Platform",
    items: [
      { id: "overview", label: "Overview" },
      { id: "overview", label: "KPI principali" },
      { id: "overview", label: "Stato sicurezza" }
    ]
  },
  {
    id: "clienti",
    label: "Clienti",
    items: [
      { id: "clients", label: "Tenant Matrix" },
      { id: "clients", label: "Gestione piani" },
      { id: "clients", label: "Gestione licenze" }
    ]
  },
  {
    id: "ricavi",
    label: "Ricavi",
    items: [
      { id: "revenue", label: "KPI MRR" },
      { id: "revenue", label: "Breakdown piani" },
      { id: "revenue", label: "Export CSV" }
    ]
  },
  {
    id: "eventi",
    label: "Eventi & Audit",
    items: [
      { id: "events", label: "Eventi recenti" },
      { id: "events", label: "Azioni critiche" },
      { id: "events", label: "Audit timeline" }
    ]
  },
  {
    id: "strumenti",
    label: "Strumenti",
    items: [
      { id: "tools", label: "Filtri globali" },
      { id: "tools", label: "Refresh dati" },
      { id: "tools", label: "Impostazioni vista" }
    ]
  }
];

const statusBadgeVariant = (status?: LicenseStatus) => {
  if (status === "ACTIVE") return "success" as const;
  if (status === "TRIAL") return "secondary" as const;
  if (status === "EXPIRED") return "destructive" as const;
  return "warning" as const;
};

const parseEventDetails = (details: unknown) => {
  if (!details || typeof details !== "object") return { sourceIp: "n/a", actor: "platform-admin", quickAction: "" };
  const payload = details as Record<string, unknown>;
  return {
    sourceIp: typeof payload.sourceIp === "string" ? payload.sourceIp : "n/a",
    actor: typeof payload.actor === "string" ? payload.actor : "platform-admin",
    quickAction: typeof payload.quickAction === "string" ? payload.quickAction : ""
  };
};

const isExpiringSoon = (expiresAt?: string | null) => {
  if (!expiresAt) return false;
  const delta = new Date(expiresAt).getTime() - Date.now();
  return delta >= 0 && delta <= 7 * 24 * 60 * 60 * 1000;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("it-IT");
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);

const toMonthKey = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "adesso";
  if (min < 60) return `${min}m fa`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h fa`;
  const d = Math.floor(h / 24);
  return `${d}g fa`;
};

const useCountUp = (target: number, duration = 560) => {
  const [value, setValue] = useState(target);

  useEffect(() => {
    const start = performance.now();
    const from = value;
    const delta = target - from;
    if (delta === 0) return;

    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(from + delta * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return value;
};

const ActionButton = ({
  label,
  busy,
  disabled,
  variant,
  onClick
}: {
  label: string;
  busy: boolean;
  disabled?: boolean;
  variant: "outline" | "destructive" | "secondary" | "ghost";
  onClick: () => void;
}) => {
  return (
    <Button
      size="sm"
      variant={variant}
      disabled={busy || disabled}
      className={`${busy ? "platform-action-loading" : ""} platform-action-button`}
      onClick={onClick}
    >
      {label}
    </Button>
  );
};

export const PlatformAdminPage = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement | null>(null);
  const sectionTargetsRef = useRef<Record<PlatformSectionId, HTMLDivElement | null>>({
    overview: null,
    clients: null,
    revenue: null,
    events: null,
    tools: null
  });

  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [search, setSearch] = useState("");
  const [licenseFilter, setLicenseFilter] = useState<"ALL" | LicenseStatus>("ALL");
  const [tenantStatusFilter, setTenantStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantRow | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [planConfirmState, setPlanConfirmState] = useState<PlanConfirmState>(null);
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});
  const [rowFeedback, setRowFeedback] = useState<Record<string, { type: "success" | "error" | "loading"; message: string }>>({});
  const [planDrafts, setPlanDrafts] = useState<Record<string, PlanTier>>({});
  const [reportMonth, setReportMonth] = useState<string>(() => toMonthKey(new Date()));
  const [revenueReport, setRevenueReport] = useState<PlatformRevenueMetrics | null>(null);
  const [activeSection, setActiveSection] = useState<PlatformSectionId>("clients");
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [openNavGroups, setOpenNavGroups] = useState<Record<string, boolean>>({
    dashboard: true,
    clienti: true,
    ricavi: true,
    eventi: true,
    strumenti: false
  });
  const reportMonthBootRef = useRef(true);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (prefersReduced) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        }
      },
      { threshold: 0.14 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const load = async (options?: { silent?: boolean }) => {
    setError(null);
    if (!options?.silent) setLoading(true);
    if (options?.silent) setRefreshing(true);

    try {
      const [tenantData, userData, eventData, revenueData] = await Promise.all([
        platformAdminUseCases.listTenants(),
        platformAdminUseCases.listUsers(),
        platformAdminUseCases.listRecentEvents(20),
        platformAdminUseCases.revenueMetrics({ month: reportMonth, months: 12 })
      ]);
      setTenants(tenantData.data);
      setUsers(userData.data);
      setEvents(eventData.data);
      setRevenueReport(revenueData);
    } catch (err) {
      if (handlePlatformAuthError(err)) return;
      const message = (err as Error).message;
      setError(message);
      snackbar.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (reportMonthBootRef.current) {
      reportMonthBootRef.current = false;
      return;
    }
    void load({ silent: true });
  }, [reportMonth]);

  useEffect(() => {
    if (!confirmState && !planConfirmState) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setConfirmState(null);
        setPlanConfirmState(null);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [confirmState, planConfirmState]);

  useEffect(() => {
    if (!sidebarMobileOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarMobileOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [sidebarMobileOpen]);

  const filteredTenants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const owner = tenant.owner ? `${tenant.owner.firstName} ${tenant.owner.lastName} ${tenant.owner.email}` : "";
      const matchesSearch = q.length === 0 || `${tenant.name} ${owner}`.toLowerCase().includes(q);
      const licenseStatus = tenant.license?.status ?? "ACTIVE";
      const matchesLicense = licenseFilter === "ALL" || licenseStatus === licenseFilter;
      const tenantState = tenant.isActive ? "ACTIVE" : "INACTIVE";
      const matchesTenantStatus = tenantStatusFilter === "ALL" || tenantStatusFilter === tenantState;
      return matchesSearch && matchesLicense && matchesTenantStatus;
    });
  }, [licenseFilter, search, tenantStatusFilter, tenants]);

  const kpis = useMemo(() => {
    const activeTenants = tenants.filter((tenant) => tenant.isActive).length;
    const activeLicenses = tenants.filter((tenant) => (tenant.license?.status ?? "ACTIVE") === "ACTIVE").length;
    const expiringSoon = tenants.filter((tenant) => isExpiringSoon(tenant.license?.expiresAt)).length;
    const suspended = tenants.filter((tenant) => (tenant.license?.status ?? "ACTIVE") === "SUSPENDED").length;
    return { activeTenants, activeLicenses, expiringSoon, suspended };
  }, [tenants]);

  const activeTenantsCounter = useCountUp(kpis.activeTenants);
  const activeLicensesCounter = useCountUp(kpis.activeLicenses);
  const expiringCounter = useCountUp(kpis.expiringSoon);
  const suspendedCounter = useCountUp(kpis.suspended);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - idx);
      return {
        value: toMonthKey(date),
        label: date.toLocaleDateString("it-IT", { month: "long", year: "numeric" })
      };
    });
  }, []);

  const revenueBreakdown = revenueReport?.breakdown ?? [];
  const revenueActiveTenants = revenueBreakdown.reduce((acc, row) => acc + row.activeTenants, 0);

  const openConfirm = (tenant: TenantRow, action: QuickAction) => {
    const impact = action === "SUSPEND_LICENSE" || action === "DEACTIVATE_TENANT";
    if (!impact) {
      void runAction(tenant.id, action);
      return;
    }

    setConfirmState({
      tenantId: tenant.id,
      tenantName: tenant.name,
      action,
      title: actionLabels[action],
      description:
        action === "SUSPEND_LICENSE"
          ? "Questa azione blocca l'accesso API del tenant finché non riattivi la licenza."
          : "Questa azione disattiva il tenant a livello platform e ferma l'operatività dell'ambiente."
    });
  };

  const runAction = async (tenantId: string, action: QuickAction) => {
    setRowLoading((old) => ({ ...old, [tenantId]: true }));
    setRowFeedback((old) => ({ ...old, [tenantId]: { type: "loading", message: "Operazione in corso..." } }));

    try {
      await platformAdminUseCases.quickAction(tenantId, action);
      setRowFeedback((old) => ({ ...old, [tenantId]: { type: "success", message: `${actionLabels[action]} completata` } }));
      snackbar.success(`${actionLabels[action]} eseguita`);
      await load({ silent: true });
    } catch (err) {
      if (handlePlatformAuthError(err)) return;
      const message = (err as Error).message;
      setRowFeedback((old) => ({ ...old, [tenantId]: { type: "error", message } }));
      snackbar.error(message);
    } finally {
      setRowLoading((old) => ({ ...old, [tenantId]: false }));
    }
  };

  const updateTenantPlan = async (tenant: TenantRow, nextPlan: PlanTier, forceActivate: boolean) => {
    const currentPlan = normalizePlanTier(tenant.license?.plan);
    const licenseStatus = tenant.license?.status ?? "ACTIVE";
    const planChanged = hasPlanChange(currentPlan, nextPlan);
    const hasStatusChange = forceActivate && licenseStatus !== "ACTIVE";
    if (!planChanged && !hasStatusChange) return;

    setRowLoading((old) => ({ ...old, [tenant.id]: true }));
    setRowFeedback((old) => ({ ...old, [tenant.id]: { type: "loading", message: "Aggiornamento piano in corso..." } }));

    try {
      const payload = buildPlanUpdatePayload({
        nextPlan,
        license: tenant.license,
        forceActive: forceActivate
      });
      const result = await platformAdminUseCases.updateLicense(tenant.id, payload);
      const savedPlan = normalizePlanTier(typeof result?.after?.plan === "string" ? result.after.plan : nextPlan);
      setPlanDrafts((old) => clearPlanDraft(old, tenant.id));
      setRowFeedback((old) => ({
        ...old,
        [tenant.id]: {
          type: "success",
          message: forceActivate ? `Piano ${savedPlan} salvato e licenza attivata` : `Piano ${savedPlan} applicato`
        }
      }));
      snackbar.success(forceActivate ? `Piano ${savedPlan} salvato e licenza attivata` : `Piano ${savedPlan} applicato`);
      await load({ silent: true });
    } catch (err) {
      if (handlePlatformAuthError(err)) return;
      const message = (err as Error).message;
      setPlanDrafts((old) => rollbackPlanDraft(old, tenant.id, currentPlan));
      setRowFeedback((old) => ({ ...old, [tenant.id]: { type: "error", message } }));
      snackbar.error(message);
    } finally {
      setRowLoading((old) => ({ ...old, [tenant.id]: false }));
    }
  };

  const requestPlanUpdate = (tenant: TenantRow, forceActivate: boolean) => {
    const nextPlan = planDrafts[tenant.id] ?? normalizePlanTier(tenant.license?.plan);
    if (!isPlanTier(nextPlan)) {
      setRowFeedback((old) => ({ ...old, [tenant.id]: { type: "error", message: "Piano non valido" } }));
      snackbar.error("Piano non valido");
      return;
    }

    const currentPlan = normalizePlanTier(tenant.license?.plan);
    const isDowngrade = isPlanDowngrade(currentPlan, nextPlan);
    if (isDowngrade) {
      setPlanConfirmState({ tenant, nextPlan, forceActivate });
      return;
    }

    void updateTenantPlan(tenant, nextPlan, forceActivate);
  };

  const onLicenseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTenant) return;

    const form = new FormData(event.currentTarget);
    try {
      const priceMonthlyRaw = String(form.get("priceMonthly") || "").trim();
      await platformAdminUseCases.updateLicense(editingTenant.id, {
        plan: String(form.get("plan") || "STARTER"),
        seats: Number(form.get("seats") || 1),
        status: String(form.get("status") || "ACTIVE") as LicenseStatus,
        expiresAt: String(form.get("expiresAt") || "") ? new Date(String(form.get("expiresAt"))).toISOString() : null,
        priceMonthly: priceMonthlyRaw ? Number(priceMonthlyRaw) : null,
        billingCycle: String(form.get("billingCycle") || "monthly") as "monthly" | "yearly"
      });
      snackbar.success("Licenza aggiornata");
      setEditingTenant(null);
      await load({ silent: true });
    } catch (err) {
      if (handlePlatformAuthError(err)) return;
      const message = (err as Error).message;
      setError(message);
      snackbar.error(message);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setLicenseFilter("ALL");
    setTenantStatusFilter("ALL");
  };

  const sectionLabel: Record<PlatformSectionId, string> = {
    overview: "Overview",
    clients: "Clienti",
    revenue: "Ricavi",
    events: "Eventi & Audit",
    tools: "Strumenti"
  };

  const scrollToSection = (sectionId: PlatformSectionId) => {
    const node = sectionTargetsRef.current[sectionId];
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY - 92;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    setActiveSection(sectionId);
    setSidebarMobileOpen(false);
  };

  const toggleGroup = (groupId: string) => {
    setOpenNavGroups((old) => ({ ...old, [groupId]: !old[groupId] }));
  };

  const isPlatformAuthError = (err: unknown) => {
    const payload = err as { status?: number; code?: string; message?: string };
    if (payload?.status === 401 || payload?.code === "UNAUTHORIZED") return true;
    return /token platform non valido|token platform mancante|accesso platform negato/i.test(payload?.message ?? "");
  };

  const handlePlatformAuthError = (err: unknown) => {
    if (!isPlatformAuthError(err)) return false;
    platformAdminUseCases.logout();
    snackbar.error("Sessione platform scaduta o non valida. Effettua di nuovo il login.");
    navigate("/login", { replace: true });
    return true;
  };

  return (
    <section ref={sectionRef} className="platform-console space-y-6">
      <div data-reveal>
        <PageHeader
          title="License Control"
          subtitle="Operazioni platform one-click con hardening attivo, audit immediato e piena visibilità sui tenant."
          actions={
            <>
              <Button variant="outline" size="sm" className="xl:hidden" onClick={() => setSidebarMobileOpen(true)}>
                <Menu className="h-4 w-4" />
                Menu sezioni
              </Button>
              <Badge variant="secondary">{sectionLabel[activeSection]}</Badge>
            </>
          }
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-24 rounded-2xl border border-border/70 bg-card/90 p-3 shadow-sm">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Navigazione Platform</p>
            <div className="space-y-2">
              {platformNavGroups.map((group) => (
                <div key={group.id} className="rounded-xl border border-border/60 bg-background/75">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-foreground"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={!!openNavGroups[group.id]}
                    aria-controls={`platform-group-${group.id}`}
                  >
                    <span>{group.label}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openNavGroups[group.id] ? "rotate-0" : "-rotate-90"}`} />
                  </button>
                  {openNavGroups[group.id] ? (
                    <div id={`platform-group-${group.id}`} className="space-y-1 border-t border-border/60 px-2 py-2">
                      {group.items.map((item, idx) => (
                        <button
                          key={`${group.id}-${item.id}-${idx}`}
                          type="button"
                          onClick={() => scrollToSection(item.id)}
                          className={`flex w-full items-center rounded-lg px-2 py-1.5 text-left text-xs transition ${
                            activeSection === item.id
                              ? "bg-primary/10 text-primary dark:bg-primary/20"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div ref={(node) => (sectionTargetsRef.current.overview = node)} className="space-y-6">
            <Card className="platform-command-hero" data-reveal>
              <CardContent className="platform-command-hero__content grid gap-4 py-6 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="platform-command-copy mx-auto w-full max-w-2xl space-y-2 text-center lg:mx-0 lg:text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Control Surface</p>
                  <p className="text-xl font-semibold text-foreground">Centro operativo licenze tenant</p>
                  <p className="text-sm text-muted-foreground">
                    Azioni rapide di attivazione, sospensione e rinnovo con audit tracciato in tempo reale.
                  </p>
                </div>
                <div className="platform-command-badges mx-auto grid w-full max-w-md gap-2 sm:grid-cols-2 lg:mx-0">
                  <div className="rounded-xl border border-cyan-300/45 bg-cyan-50 px-3 py-2 text-sm text-cyan-900 dark:border-cyan-400/30 dark:bg-cyan-500/15 dark:text-cyan-100">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-700/80 dark:text-cyan-100/80">Scope</p>
                    <p className="font-semibold">Platform-only</p>
                  </div>
                  <div className="rounded-xl border border-emerald-300/45 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-700/80 dark:text-emerald-100/80">Security</p>
                    <p className="font-semibold">IP Restricted</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-reveal>
              <PlatformKpiCard
                title="Tenant attivi"
                value={activeTenantsCounter}
                subtitle={`Operativi su ${tenants.length} tenant`}
                icon={<Users className="h-5 w-5" />}
              />
              <PlatformKpiCard
                title="Licenze ACTIVE"
                value={activeLicensesCounter}
                subtitle="Tenant con licenza valida"
                icon={<CheckCircle2 className="h-5 w-5" />}
                valueClassName="text-emerald-700 dark:text-emerald-400"
              />
              <PlatformKpiCard
                title="In scadenza < 7gg"
                value={expiringCounter}
                subtitle="Richiede rinnovo rapido"
                icon={<Clock3 className="h-5 w-5" />}
                valueClassName="text-amber-600 dark:text-amber-400"
              />
              <PlatformKpiCard
                title="Licenze sospese"
                value={suspendedCounter}
                subtitle="Da riattivare se necessario"
                icon={<XCircle className="h-5 w-5" />}
                valueClassName="text-rose-600 dark:text-rose-400"
              />
            </div>
          </div>

          <div ref={(node) => (sectionTargetsRef.current.revenue = node)}>
            <Card className="platform-main-card" data-reveal>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base text-foreground">Piani & Ricavi Mensili</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} className="min-w-[190px]">
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const blob = await platformAdminUseCases.revenueCsv({ month: reportMonth, months: 12 });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `platform-revenue-${reportMonth}.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                    snackbar.success("Export ricavi completato");
                  } catch (err) {
                    if (handlePlatformAuthError(err)) return;
                    snackbar.error((err as Error).message);
                  }
                }}
              >
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {revenueReport ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">MRR totale</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(revenueReport.kpis.mrrTotal)}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">MRR perso</p>
                  <p className="mt-1 text-xl font-semibold text-rose-600 dark:text-rose-300">{formatCurrency(revenueReport.kpis.mrrLost)}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Delta vs mese precedente</p>
                  <p className={`mt-1 text-xl font-semibold ${revenueReport.kpis.deltaFromPrevious >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
                    {formatCurrency(revenueReport.kpis.deltaFromPrevious)}
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Tenant attivi a ricavo</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{revenueActiveTenants}</p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="overflow-auto rounded-2xl border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Piano</TableHead>
                        <TableHead>Prezzo base</TableHead>
                        <TableHead>Tenant attivi</TableHead>
                        <TableHead>Tenant totali</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Ricavo stimato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueBreakdown.map((row) => (
                        <TableRow key={row.plan}>
                          <TableCell><Badge variant="secondary">{row.plan}</Badge></TableCell>
                          <TableCell>{formatCurrency(row.basePrice)}</TableCell>
                          <TableCell>{row.activeTenants}</TableCell>
                          <TableCell>{row.totalTenants}</TableCell>
                          <TableCell>{row.seatsTotal}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(row.estimatedRevenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Trend ultimi mesi</p>
                  {revenueReport.trend.map((row) => (
                    <div key={row.month} className="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground">{row.month}</p>
                        <p className="text-foreground">{formatCurrency(row.mrrTotal)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">MRR perso: {formatCurrency(row.mrrLost)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Formula: {revenueReport.assumptions.formula}. {revenueReport.assumptions.seatsFactorRule}. {revenueReport.assumptions.billingCycleRule}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Caricamento report ricavi...</p>
          )}
        </CardContent>
            </Card>
          </div>

          <div ref={(node) => (sectionTargetsRef.current.clients = node)} className="space-y-3">
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Sezione Clienti</p>
              <p className="text-sm text-foreground">Gestisci tenant, piani e licenze da un unico pannello operativo.</p>
            </div>

            <Card className="platform-main-card platform-main-surface" data-reveal>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              Tenant Matrix
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {filteredTenants.length} visibili
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {refreshing ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  sync...
                </span>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => load({ silent: true })}>
                <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Aggiorna dati
              </Button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-[1.6fr_1fr_1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Cerca tenant o owner..." />
            </div>
            <Select value={licenseFilter} onChange={(e) => setLicenseFilter(e.target.value as LicenseStatus | "ALL")}>
              <option value="ALL">Licenza: tutte</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="TRIAL">TRIAL</option>
            </Select>
            <Select value={tenantStatusFilter} onChange={(e) => setTenantStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}>
              <option value="ALL">Tenant: tutti</option>
              <option value="ACTIVE">Tenant attivi</option>
              <option value="INACTIVE">Tenant inattivi</option>
            </Select>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {error ? (
            <div className="rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
              <p className="font-semibold">Errore caricamento pannello</p>
              <p>{error}</p>
              <Button className="mt-3" size="sm" onClick={() => load()}>
                Riprova
              </Button>
            </div>
          ) : null}

          <div className="platform-table-wrap overflow-auto rounded-2xl border border-border/70">
            <Table className="platform-tenant-table">
              <TableHeader className="platform-table-header sticky top-0 z-20 backdrop-blur">
                <TableRow className="border-b border-border/70">
                  <TableHead className="w-[230px]">Tenant</TableHead>
                  <TableHead className="w-[240px]">Owner</TableHead>
                  <TableHead className="w-[120px] text-center">Stato tenant</TableHead>
                  <TableHead className="w-[220px]">Piano</TableHead>
                  <TableHead className="w-[120px] text-center">Licenza</TableHead>
                  <TableHead className="w-[150px]">Scadenza</TableHead>
                  <TableHead className="w-[90px] text-center">Seats</TableHead>
                  <TableHead className="min-w-[480px]">Quick actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? [...Array(4)].map((_, idx) => (
                      <TableRow key={`s-${idx}`}>
                        <TableCell colSpan={8}>
                          <div className="platform-skeleton h-11 w-full rounded-lg" />
                        </TableCell>
                      </TableRow>
                    ))
                  : null}

                {!loading && filteredTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="grid place-items-center gap-2 py-12 text-center text-muted-foreground">
                        <Users className="h-5 w-5" />
                        <p className="font-medium text-foreground">Nessun tenant trovato con i filtri attuali</p>
                        <p className="text-xs">Modifica ricerca o usa reset filtri</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}

                {!loading &&
                  filteredTenants.map((tenant) => {
                    const feedback = rowFeedback[tenant.id];
                    const busy = !!rowLoading[tenant.id];
                    const currentPlan = normalizePlanTier(tenant.license?.plan);
                    const selectedPlan = planDrafts[tenant.id] ?? currentPlan;
                    const licenseStatus = tenant.license?.status ?? "ACTIVE";
                    const hasPlanChanges = hasPlanChange(currentPlan, selectedPlan);
                    const canApplyPlan = canApplyPlanChange({ busy, currentPlan, nextPlan: selectedPlan });
                    const canApplyAndActivate = canApplyPlanAndActivate({
                      busy,
                      currentPlan,
                      nextPlan: selectedPlan,
                      licenseStatus
                    });

                    return (
                      <TableRow key={tenant.id} className="platform-tenant-row">
                        <TableCell className="platform-tenant-cell">
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">{tenant.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {tenant.id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="platform-tenant-cell">
                          {tenant.owner ? (
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                {tenant.owner.firstName} {tenant.owner.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{tenant.owner.email}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="platform-tenant-cell text-center">
                          <Badge variant={tenant.isActive ? "success" : "destructive"}>{tenant.isActive ? "ACTIVE" : "INACTIVE"}</Badge>
                        </TableCell>
                        <TableCell className="platform-tenant-cell">
                          <div className="platform-plan-cell">
                            <Select
                              value={selectedPlan}
                              onChange={(event) => {
                                const next = event.target.value;
                                if (!isPlanTier(next)) return;
                                setPlanDrafts((old) => ({ ...old, [tenant.id]: next }));
                              }}
                              className="h-9 text-xs"
                              aria-label={`Seleziona piano per ${tenant.name}`}
                            >
                              {PLAN_TIERS.map((plan) => (
                                <option key={`${tenant.id}-${plan}`} value={plan}>
                                  {plan}
                                </option>
                              ))}
                            </Select>
                            {hasPlanChanges ? <p className="text-[11px] text-amber-600 dark:text-amber-300">Modifica non salvata</p> : null}
                          </div>
                        </TableCell>
                        <TableCell className="platform-tenant-cell text-center">
                          <Badge variant={statusBadgeVariant(licenseStatus)}>{licenseStatus}</Badge>
                        </TableCell>
                        <TableCell className="platform-tenant-cell">
                          <div className="space-y-1">
                            <p className="text-foreground">{formatDate(tenant.license?.expiresAt)}</p>
                            {isExpiringSoon(tenant.license?.expiresAt) ? <Badge variant="warning">in scadenza &lt; 7 giorni</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell className="platform-tenant-cell text-center text-foreground">{tenant.license?.seats ?? 3}</TableCell>
                        <TableCell className="platform-tenant-cell">
                          <div className="platform-action-stack">
                            <div className="platform-action-group">
                              <ActionButton
                                label="Applica piano"
                                busy={busy}
                                disabled={!canApplyPlan}
                                variant="secondary"
                                onClick={() => requestPlanUpdate(tenant, false)}
                              />
                              <ActionButton
                                label="Salva + Attiva"
                                busy={busy}
                                disabled={!canApplyAndActivate}
                                variant="secondary"
                                onClick={() => requestPlanUpdate(tenant, true)}
                              />
                            </div>
                            <div className="platform-action-group">
                              <ActionButton label="Attiva" busy={busy} variant="outline" onClick={() => openConfirm(tenant, "ACTIVATE_LICENSE")} />
                              <ActionButton label="Sospendi" busy={busy} variant="destructive" onClick={() => openConfirm(tenant, "SUSPEND_LICENSE")} />
                              <ActionButton label="+30g" busy={busy} variant="outline" onClick={() => openConfirm(tenant, "RENEW_30_DAYS")} />
                              <ActionButton label="+365g" busy={busy} variant="outline" onClick={() => openConfirm(tenant, "RENEW_365_DAYS")} />
                            </div>
                            <div className="platform-action-group">
                              <ActionButton
                                label="Disattiva tenant"
                                busy={busy}
                                variant="destructive"
                                onClick={() => openConfirm(tenant, "DEACTIVATE_TENANT")}
                              />
                              <ActionButton label="Riattiva" busy={busy} variant="secondary" onClick={() => openConfirm(tenant, "REACTIVATE_TENANT")} />
                              <ActionButton label="Manuale" busy={busy} variant="ghost" onClick={() => setEditingTenant(tenant)} />
                            </div>
                            {feedback ? (
                              <p
                                className={
                                  feedback.type === "error"
                                    ? "text-xs text-red-600 dark:text-red-300"
                                    : feedback.type === "loading"
                                      ? "text-xs text-muted-foreground"
                                      : "text-xs text-emerald-600 dark:text-emerald-300"
                                }
                              >
                                {feedback.message}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
            </Card>
          </div>

          <div ref={(node) => (sectionTargetsRef.current.events = node)} className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]" data-reveal>
            <Card className="platform-main-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Eventi recenti platform</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="grid place-items-center gap-2 py-8 text-sm text-muted-foreground">
                <ShieldAlert className="h-5 w-5" />
                Nessun evento disponibile.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
                  const details = parseEventDetails(event.details);
                  return (
                    <PlatformEventItem
                      key={event.id}
                      action={event.action}
                      tenantName={event.tenantName}
                      createdAt={event.createdAt}
                      actor={details.actor}
                      sourceIp={details.sourceIp}
                      quickAction={details.quickAction}
                      timeAgo={timeAgo(event.createdAt)}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
            </Card>

            <Card className="platform-main-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Watchlist operativa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="platform-watch-item platform-watch-item--warning">
              <p className="platform-watch-item__text">
                <AlertTriangle className="h-4 w-4" />
                Licenze in scadenza: {kpis.expiringSoon}
              </p>
            </div>
            <div className="platform-watch-item platform-watch-item--danger">
              <p className="platform-watch-item__text">
                <ShieldAlert className="h-4 w-4" />
                Licenze sospese: {kpis.suspended}
              </p>
            </div>
            <div className="platform-watch-item platform-watch-item--info">
              <p className="platform-watch-item__text">
                <Zap className="h-4 w-4" />
                One-click control attivo
              </p>
            </div>
            <div className="space-y-2 pt-1">
              {users.slice(0, 8).map((user) => (
                <div key={user.id} className="rounded-xl border border-border/70 bg-card/75 px-3 py-2 text-sm">
                  <p className="font-medium text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.email} · {user.tenant?.name ?? "N/A"} · {user.status}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
            </Card>
          </div>

          <div ref={(node) => (sectionTargetsRef.current.tools = node)} data-reveal>
            <Card className="platform-main-card">
              <CardHeader>
                <CardTitle className="text-base text-foreground">Strumenti Operativi</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Azioni globali</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => load({ silent: true })}>
                      <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                      Aggiorna tutto
                    </Button>
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Reset filtri clienti
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Navigazione rapida</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => scrollToSection("clients")}>
                      Vai a Clienti
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => scrollToSection("revenue")}>
                      Vai a Ricavi
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => scrollToSection("events")}>
                      Vai a Eventi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[130] bg-black/45 backdrop-blur-sm transition-opacity xl:hidden ${
          sidebarMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`h-full w-[88%] max-w-sm border-r border-border/70 bg-card p-4 transition-transform ${
            sidebarMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Menu Platform</p>
            <Button variant="ghost" size="sm" onClick={() => setSidebarMobileOpen(false)}>
              Chiudi
            </Button>
          </div>
          <div className="space-y-2">
            {platformNavGroups.map((group) => (
              <div key={`mobile-${group.id}`} className="rounded-xl border border-border/60 bg-background/75">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-foreground"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!!openNavGroups[group.id]}
                >
                  <span>{group.label}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openNavGroups[group.id] ? "rotate-0" : "-rotate-90"}`} />
                </button>
                {openNavGroups[group.id] ? (
                  <div className="space-y-1 border-t border-border/60 px-2 py-2">
                    {group.items.map((item, idx) => (
                      <button
                        key={`mobile-item-${group.id}-${item.id}-${idx}`}
                        type="button"
                        onClick={() => scrollToSection(item.id)}
                        className={`flex w-full items-center rounded-lg px-2 py-1.5 text-left text-xs transition ${
                          activeSection === item.id
                            ? "bg-primary/10 text-primary dark:bg-primary/20"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingTenant && activeSection === "clients" ? (
        <Card className="platform-main-card" data-reveal>
          <CardHeader>
            <CardTitle className="text-base text-foreground">Modifica manuale licenza · {editingTenant.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={onLicenseSubmit}>
              <div className="grid gap-1.5">
                <Label>Piano</Label>
                <Select name="plan" defaultValue={editingTenant.license?.plan ?? "STARTER"}>
                  <option value="STARTER">STARTER</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Posti licenza</Label>
                <Input name="seats" type="number" min={1} defaultValue={editingTenant.license?.seats ?? 3} required />
              </div>
              <div className="grid gap-1.5">
                <Label>Stato licenza</Label>
                <Select name="status" defaultValue={editingTenant.license?.status ?? "ACTIVE"}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="TRIAL">TRIAL</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Scadenza</Label>
                <Input
                  name="expiresAt"
                  type="datetime-local"
                  defaultValue={editingTenant.license?.expiresAt ? new Date(editingTenant.license.expiresAt).toISOString().slice(0, 16) : ""}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Prezzo mensile override (EUR)</Label>
                <Input
                  name="priceMonthly"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={editingTenant.license?.priceMonthly ?? ""}
                  placeholder="es. 149"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Ciclo fatturazione</Label>
                <Select name="billingCycle" defaultValue={editingTenant.license?.billingCycle ?? "monthly"}>
                  <option value="monthly">Mensile</option>
                  <option value="yearly">Annuale</option>
                </Select>
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit">Salva licenza</Button>
                <Button type="button" variant="outline" onClick={() => setEditingTenant(null)}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {planConfirmState ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="modal-pop w-full max-w-lg rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl" role="dialog" aria-modal="true">
            <h3 className="text-lg font-semibold">Conferma downgrade piano</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tenant: <span className="font-medium text-foreground">{planConfirmState.tenant.name}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Il piano passerà da{" "}
              <span className="font-semibold text-foreground">{normalizePlanTier(planConfirmState.tenant.license?.plan)}</span> a{" "}
              <span className="font-semibold text-foreground">{planConfirmState.nextPlan}</span>. Confermi il downgrade?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPlanConfirmState(null)}>
                Annulla
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const value = planConfirmState;
                  setPlanConfirmState(null);
                  void updateTenantPlan(value.tenant, value.nextPlan, value.forceActivate);
                }}
              >
                Conferma downgrade
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmState ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="modal-pop w-full max-w-lg rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl" role="dialog" aria-modal="true">
            <h3 className="text-lg font-semibold">{confirmState.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tenant: <span className="font-medium text-foreground">{confirmState.tenantName}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{confirmState.description}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmState(null)}>
                Annulla
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const value = confirmState;
                  setConfirmState(null);
                  void runAction(value.tenantId, value.action);
                }}
              >
                Conferma azione
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
