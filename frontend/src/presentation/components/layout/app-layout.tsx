import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BellRing,
  Building2,
  CalendarDays,
  CarFront,
  ChartColumnIncreasing,
  ClipboardList,
  Gauge,
  KanbanSquare,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  TimerReset,
  TriangleAlert,
  UserPlus,
  Users,
  Wrench,
  X
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authUseCases } from "../../../application/usecases/auth-usecases";
import { notificationsUseCases } from "../../../application/usecases/notifications-usecases";
import { useAuthStore } from "../../../application/stores/auth-store";
import { ensureKnownPlan, FeatureKey } from "../../../domain/constants/entitlements";
import { ThemeMode, getStoredTheme, setTheme } from "../../../infrastructure/theme/theme-manager";
import { cn } from "../../../lib/utils";
import { useEntitlements } from "../../hooks/use-entitlements";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type NavItem = {
  key: string;
  label: string;
  to: string;
  icon: any;
  feature?: FeatureKey;
  match: (pathname: string) => boolean;
};

const navSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Panoramica",
    items: [
      { key: "dashboard", to: "/dashboard", label: "Dashboard", icon: Gauge, match: (path) => path === "/dashboard" },
      {
        key: "fermi-lista",
        to: "/fermi",
        label: "Fermi",
        icon: ClipboardList,
        match: (path) =>
          path.startsWith("/fermi") &&
          !path.startsWith("/fermi/kanban") &&
          !path.startsWith("/fermi/calendario")
      },
      {
        key: "fermi-kanban",
        to: "/fermi/kanban",
        label: "Kanban Fermi",
        icon: KanbanSquare,
        match: (path) => path.startsWith("/fermi/kanban")
      },
      {
        key: "fermi-calendario",
        to: "/fermi/calendario",
        label: "Calendario Fermi",
        icon: CalendarDays,
        match: (path) => path.startsWith("/fermi/calendario")
      },
      {
        key: "statistiche",
        to: "/statistiche",
        label: "Statistiche",
        icon: ChartColumnIncreasing,
        match: (path) => path.startsWith("/statistiche")
      }
    ]
  },
  {
    title: "Anagrafiche",
    items: [
      { key: "sedi", to: "/anagrafiche/sedi", label: "Sedi", icon: Building2, match: (path) => path.startsWith("/anagrafiche/sedi") },
      { key: "officine", to: "/anagrafiche/officine", label: "Officine", icon: Wrench, match: (path) => path.startsWith("/anagrafiche/officine") },
      { key: "veicoli", to: "/anagrafiche/veicoli", label: "Veicoli", icon: CarFront, match: (path) => path.startsWith("/anagrafiche/veicoli") }
    ]
  },
  {
    title: "Organizzazione",
    items: [
      { key: "utenti", to: "/utenti", label: "Utenti e Ruoli", icon: Users, match: (path) => path.startsWith("/utenti") },
      { key: "profilo", to: "/profilo", label: "Profilo e Impostazioni", icon: Settings, match: (path) => path.startsWith("/profilo") }
    ]
  }
];

const mobileNavItems: Array<{ to: string; label: string; icon: any; feature?: FeatureKey }> = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/fermi", label: "Fermi", icon: ClipboardList },
  { to: "/fermi/kanban", label: "Kanban", icon: KanbanSquare },
  { to: "/fermi/calendario", label: "Calendario", icon: CalendarDays },
  { to: "/statistiche", label: "Statistiche", icon: ChartColumnIncreasing },
  { to: "/profilo", label: "Profilo", icon: Settings }
];

export const AppLayout = () => {
  const sidebarStorageKey = "fermi_sidebar_hidden";
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, setUser, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [backendReachable, setBackendReachable] = useState(true);
  const [healthFailures, setHealthFailures] = useState(0);
  const [licenseInfo, setLicenseInfo] = useState<null | { plan: string; expiringSoon: boolean; daysRemaining: number | null; expiresAt: string | null }>(null);
  const [sidebarHidden, setSidebarHidden] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(sidebarStorageKey) === "1";
  });
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const { can, plan } = useEntitlements();
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const dismissedStorageKey = useMemo(
    () => (user ? `fermi_dismissed_notifications:${user.tenantId}:${user.id}` : null),
    [user]
  );

  const scrollToTop = useCallback(() => {
    if (typeof window === "undefined") return;
    const scrollingElement = document.scrollingElement as HTMLElement | null;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (scrollingElement) scrollingElement.scrollTop = 0;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    scrollToTop();
    const raf = window.requestAnimationFrame(scrollToTop);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
    return () => window.cancelAnimationFrame(raf);
  }, [location.pathname, location.key, scrollToTop]);

  useEffect(() => {
    if (!token || user) return;
    authUseCases.me().then(setUser).catch(() => logout());
  }, [logout, setUser, token, user]);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    const loadLicense = async () => {
      try {
        const info = await authUseCases.licenseStatus();
        if (!mounted) return;
        setLicenseInfo({
          plan: info.plan,
          expiringSoon: info.expiringSoon,
          daysRemaining: info.daysRemaining,
          expiresAt: info.expiresAt
        });
      } catch {
        if (mounted) setLicenseInfo(null);
      }
    };
    loadLicense();
    const interval = setInterval(loadLicense, 15 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [token]);

  useEffect(() => {
    if (!dismissedStorageKey) {
      setDismissedNotificationIds([]);
      return;
    }
    try {
      const raw = localStorage.getItem(dismissedStorageKey);
      if (!raw) {
        setDismissedNotificationIds([]);
        return;
      }
      const parsed = JSON.parse(raw);
      setDismissedNotificationIds(Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === "string") : []);
    } catch {
      setDismissedNotificationIds([]);
    }
  }, [dismissedStorageKey]);

  useEffect(() => {
    if (!dismissedStorageKey) return;
    localStorage.setItem(dismissedStorageKey, JSON.stringify(dismissedNotificationIds));
  }, [dismissedNotificationIds, dismissedStorageKey]);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    const load = async () => {
      try {
        const result = await notificationsUseCases.inbox();
        if (mounted) setNotifications(result.data ?? []);
      } catch {
        if (mounted) setNotifications([]);
      }
    };
    load();
    const stream = new EventSource(notificationsUseCases.streamUrl());
    stream.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (mounted) setNotifications(payload.data ?? []);
      } catch {
        // ignore parse errors
      }
    };
    stream.onerror = () => {
      // Keep polling fallback, avoid reload loops on SSE instability.
    };
    const interval = setInterval(load, 120000);
    return () => {
      mounted = false;
      clearInterval(interval);
      stream.close();
    };
  }, [token]);

  useEffect(() => {
    let mounted = true;
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
    const check = async () => {
      try {
        const res = await fetch(`${base}/health`);
        if (!mounted) return;
        if (res.ok) {
          setHealthFailures(0);
          setBackendReachable(true);
        } else {
          setHealthFailures((prev) => {
            const next = prev + 1;
            if (next >= 3) setBackendReachable(false);
            return next;
          });
        }
      } catch {
        if (!mounted) return;
        setHealthFailures((prev) => {
          const next = prev + 1;
          if (next >= 3) setBackendReachable(false);
          return next;
        });
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const visibleNavSections = useMemo(
    () =>
      navSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => !item.feature || can(item.feature))
        }))
        .filter((section) => section.items.length > 0),
    [can]
  );

  const visibleMobileNavItems = useMemo(
    () => mobileNavItems.filter((item) => !item.feature || can(item.feature)),
    [can]
  );

  const activeLabel = useMemo(() => {
    if (location.pathname.startsWith("/upgrade")) return "Upgrade piano";
    for (const section of visibleNavSections) {
      for (const item of section.items) {
        if (item.match(location.pathname)) return item.label;
      }
    }
    return "Gestione Fermi";
  }, [location.pathname, visibleNavSections]);

  const isCalendarRoute = location.pathname.startsWith("/fermi/calendario");

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => !dismissedNotificationIds.includes(item.id)),
    [dismissedNotificationIds, notifications]
  );

  const notificationSummary = useMemo(() => {
    const counts = visibleNotifications.reduce(
      (acc, item) => {
        if (item.type === "STOPPAGE_OVERDUE") acc.overdue += 1;
        if (item.type === "REMINDER_FAILED") acc.failed += 1;
        if (item.type === "USER_INVITED_PENDING") acc.invited += 1;
        return acc;
      },
      { overdue: 0, failed: 0, invited: 0 }
    );
    return counts;
  }, [visibleNotifications]);

  const displayedPlan = useMemo(() => ensureKnownPlan(licenseInfo?.plan ?? plan), [licenseInfo?.plan, plan]);

  const formatRelativeTime = (value?: string) => {
    if (!value) return "Ora";
    const at = new Date(value).getTime();
    if (Number.isNaN(at)) return "Ora";
    const diffMin = Math.floor((Date.now() - at) / 60000);
    if (diffMin < 1) return "Ora";
    if (diffMin < 60) return `${diffMin} min fa`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} h fa`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} g fa`;
  };

  const notificationMeta = (item: any) => {
    if (item.type === "STOPPAGE_OVERDUE") return { icon: TimerReset, tone: "text-amber-600 dark:text-amber-300", to: "/fermi" };
    if (item.type === "REMINDER_FAILED") return { icon: TriangleAlert, tone: "text-red-600 dark:text-red-300", to: "/fermi" };
    return { icon: UserPlus, tone: "text-blue-600 dark:text-blue-300", to: "/utenti" };
  };

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setThemeState(nextTheme);
  };

  const toggleSidebar = () => {
    setSidebarHidden((prev) => {
      const next = !prev;
      localStorage.setItem(sidebarStorageKey, next ? "1" : "0");
      return next;
    });
  };

  const dismissNotification = (notificationId: string) => {
    setDismissedNotificationIds((old) => (old.includes(notificationId) ? old : [...old, notificationId]));
  };

  const restoreNotifications = () => {
    setDismissedNotificationIds([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-x-0 top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div
          className={cn(
            "mx-auto flex h-16 w-full max-w-[1460px] min-w-0 items-center justify-between gap-3 px-4 sm:px-6",
            sidebarHidden ? "lg:pl-6" : "lg:pl-[304px]"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Pannello operativo</p>
              <p className="truncate text-sm font-semibold text-foreground">{activeLabel}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="icon" className="hidden lg:inline-flex" onClick={toggleSidebar}>
              {sidebarHidden ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>

            <div ref={notificationsMenuRef} className="relative">
              <Button
                variant="outline"
                size="icon"
                aria-label="Apri notifiche"
                onClick={() => {
                  setNotificationsOpen((v) => !v);
                  setProfileOpen(false);
                }}
              >
                <BellRing className="h-4 w-4" />
              </Button>
              {visibleNotifications.length > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                  {visibleNotifications.length > 9 ? "9+" : visibleNotifications.length}
                </span>
              ) : null}

              {notificationsOpen ? (
                <div className="absolute right-0 top-11 z-50 w-[min(360px,calc(100vw-1rem))] rounded-xl border bg-card p-3 shadow-2xl">
                  <div className="rounded-lg border bg-muted/35 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Riepilogo notifiche</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded border bg-background p-2">
                        <p className="text-muted-foreground">Fermi critici</p>
                        <p className="mt-1 text-base font-semibold">{notificationSummary.overdue}</p>
                      </div>
                      <div className="rounded border bg-background p-2">
                        <p className="text-muted-foreground">Reminder KO</p>
                        <p className="mt-1 text-base font-semibold">{notificationSummary.failed}</p>
                      </div>
                      <div className="rounded border bg-background p-2">
                        <p className="text-muted-foreground">Inviti aperti</p>
                        <p className="mt-1 text-base font-semibold">{notificationSummary.invited}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 max-h-[360px] space-y-2 overflow-auto pr-1">
                    {visibleNotifications.length === 0 ? (
                      <p className="rounded border border-dashed p-3 text-sm text-muted-foreground">Nessuna notifica.</p>
                    ) : (
                      visibleNotifications.slice(0, 12).map((item) => {
                        const meta = notificationMeta(item);
                        const Icon = meta.icon;
                        return (
                          <div key={item.id} className="rounded border bg-background p-2.5">
                            <div className="flex items-start gap-2">
                              <Icon className={`mt-0.5 h-4 w-4 ${meta.tone}`} />
                              <button
                                type="button"
                                onClick={() => {
                                  setNotificationsOpen(false);
                                  navigate(meta.to);
                                }}
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="truncate text-sm font-semibold">{item.title}</p>
                                  <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                              </button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                aria-label="Rimuovi notifica"
                                onClick={() => dismissNotification(item.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t pt-2">
                    <p className="text-xs text-muted-foreground">
                      {dismissedNotificationIds.length > 0
                        ? `${dismissedNotificationIds.length} notifica${dismissedNotificationIds.length > 1 ? "he" : ""} rimoss${dismissedNotificationIds.length > 1 ? "e" : "a"}`
                        : "Aggiornamento live attivo"}
                    </p>
                    <div className="flex items-center gap-1">
                      {dismissedNotificationIds.length > 0 ? (
                        <Button size="sm" variant="ghost" onClick={restoreNotifications}>
                          Ripristina
                        </Button>
                      ) : null}
                      {visibleNotifications.length > 0 ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setNotificationsOpen(false);
                            navigate("/fermi");
                          }}
                        >
                          Apri centro operativo
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Cambia tema">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <div ref={profileMenuRef} className="relative">
              <Button
                variant="outline"
                className="h-9 rounded-full px-3"
                aria-label="Apri menu profilo"
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotificationsOpen(false);
                }}
              >
                <span className="mr-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {displayedPlan}
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-full border bg-card text-sm font-medium">
                  {(user?.firstName?.[0] ?? "U").toUpperCase()}
                </span>
              </Button>

              {profileOpen ? (
                <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border bg-card p-3 shadow-2xl">
                  <div className="rounded-lg border bg-muted/35 p-3">
                    <p className="text-sm font-semibold text-foreground">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <Badge variant="secondary" className="mt-2 uppercase tracking-[0.08em]">
                      Piano: {displayedPlan}
                    </Badge>
                  </div>
                  <div className="mt-2 grid gap-1">
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/upgrade");
                      }}
                    >
                      Upgrade piano
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/profilo");
                      }}
                    >
                      Profilo e impostazioni
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-destructive hover:text-destructive"
                      onClick={() => {
                        setProfileOpen(false);
                        onLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Esci
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-16 z-30 hidden w-72 border-r bg-card/95 px-5 pb-6 pt-4 text-slate-800 transition-transform duration-300 dark:text-slate-200 lg:block",
          sidebarHidden ? "-translate-x-full lg:pointer-events-none" : "translate-x-0"
        )}
      >
        <div className="rounded-lg border bg-muted/35 p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Gestione Fermi</p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Fleet Ops Suite</p>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{user?.firstName} {user?.lastName}</p>
        </div>

        <nav className="mt-4 space-y-5 overflow-y-auto pb-6">
          {visibleNavSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = item.match(location.pathname);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      onClick={scrollToTop}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/55 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div
          className={cn(
            "h-full w-[86%] max-w-xs bg-card px-4 pb-5 pt-4 text-slate-800 transition-transform dark:text-slate-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Menu</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">Gestione Fermi</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => setMobileOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="space-y-1">
            {visibleNavSections.flatMap((x) => x.items).map((item) => {
              const Icon = item.icon;
              const active = item.match(location.pathname);
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => {
                    setMobileOpen(false);
                    scrollToTop();
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                    active ? "bg-primary text-primary-foreground" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main
        className={cn(
          "pb-24 pt-[4.5rem] lg:pb-10",
          sidebarHidden ? "lg:ml-0" : "lg:ml-72",
          isCalendarRoute && "pb-8"
        )}
      >
        <div className={cn("mx-auto w-full px-4 sm:px-6", isCalendarRoute ? "max-w-none lg:px-4" : "max-w-[1460px]")}>
          {!backendReachable ? (
            <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Backend non raggiungibile. Verifica che API e database siano attivi. (tentativi falliti: {healthFailures})
            </div>
          ) : null}
          {licenseInfo?.expiringSoon ? (
            <div className="mb-4 rounded-xl border border-amber-400/50 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
              Licenza in scadenza
              {licenseInfo.daysRemaining !== null ? ` tra ${licenseInfo.daysRemaining} giorni` : ""}.
              {licenseInfo.expiresAt ? ` Scadenza: ${new Date(licenseInfo.expiresAt).toLocaleDateString("it-IT")}.` : ""}
            </div>
          ) : null}
          <Outlet />
        </div>
      </main>

      <div className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-border/60 bg-card/95 p-2 shadow-xl backdrop-blur lg:hidden">
        <div className="grid grid-cols-6 gap-1">
          {visibleMobileNavItems.map((item) => {
            const active =
              item.to === "/fermi"
                ? location.pathname.startsWith("/fermi") &&
                  !location.pathname.startsWith("/fermi/kanban") &&
                  !location.pathname.startsWith("/fermi/calendario")
                : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
