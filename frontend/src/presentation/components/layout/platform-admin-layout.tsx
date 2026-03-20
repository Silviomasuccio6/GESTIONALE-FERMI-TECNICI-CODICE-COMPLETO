import { useEffect, useState } from "react";
import { ArrowLeftRight, Lock, ShieldCheck } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { platformAdminUseCases } from "../../../application/usecases/platform/platform-admin-usecases";
import { ThemeMode, getStoredTheme, setTheme } from "../../../infrastructure/theme/theme-manager";
import { PlatformThemeToggle } from "../platform/platform-theme-toggle";
import { Button } from "../ui/button";

export const PlatformAdminLayout = () => {
  const navigate = useNavigate();
  const clientAppUrl = import.meta.env.VITE_CLIENT_APP_URL || "http://localhost:5173/dashboard";
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    setTheme(themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <div className="platform-shell min-h-screen bg-background">
      <header className="platform-topbar sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="mx-auto flex h-16 max-w-[1540px] min-w-0 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border bg-muted text-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Platform Console</p>
              <p className="truncate text-sm font-semibold text-foreground">Pannello di Controllo</p>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-foreground lg:flex">
            <Lock className="h-3.5 w-3.5" />
            Local-only · IP restricted
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <PlatformThemeToggle mode={themeMode} onToggle={toggleTheme} />
            <Button variant="outline" size="sm" onClick={() => (window.location.href = clientAppUrl)}>
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Gestionale
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                platformAdminUseCases.logout();
                navigate("/login");
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1540px] space-y-6 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
};
