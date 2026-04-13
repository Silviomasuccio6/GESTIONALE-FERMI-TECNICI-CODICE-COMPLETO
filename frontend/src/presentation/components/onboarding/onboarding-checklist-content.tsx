import { useMemo, useState } from "react";
import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarDays,
  CarFront,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Clock4,
  Sparkles,
  Target,
  Users,
  Wrench
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { statsUseCases } from "../../../application/usecases/stats-usecases";
import { cn } from "../../../lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useAsync } from "../../hooks/use-async";

const stepRouteMap: Record<string, string> = {
  sites: "/anagrafiche/sedi",
  workshops: "/anagrafiche/officine",
  vehicles: "/anagrafiche/veicoli",
  users: "/utenti",
  stoppages: "/fermi/nuovo",
  maintenances: "/anagrafiche/manutenzioni",
  deadlines: "/anagrafiche/scadenziario",
  calendar: "/fermi/calendario"
};

const stepIconMap: Record<string, typeof Building2> = {
  sites: Building2,
  workshops: Wrench,
  vehicles: CarFront,
  users: Users,
  stoppages: ClipboardList,
  maintenances: Wrench,
  deadlines: BellRing,
  calendar: CalendarDays
};

type OnboardingChecklistContentProps = {
  onNavigateRoute?: (route: string) => void;
};

export const OnboardingChecklistContent = ({ onNavigateRoute }: OnboardingChecklistContentProps) => {
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const onboarding = useAsync(() => statsUseCases.onboardingChecklist(), [reloadKey]);
  const steps = onboarding.data?.steps ?? [];
  const kpis = onboarding.data?.kpis ?? {
    completed: 0,
    total: 0,
    completionRate: 0,
    isReady: false
  };

  const openRoute = (route: string) => {
    if (onNavigateRoute) {
      onNavigateRoute(route);
      return;
    }
    navigate(route);
  };
  const nextStep = steps.find((step) => !step.completed) ?? null;
  const pendingCount = Math.max(0, steps.length - kpis.completed);

  const groupedSections = useMemo(() => {
    const groupMap: Record<string, string> = {
      sites: "Baseline dati",
      workshops: "Baseline dati",
      vehicles: "Baseline dati",
      users: "Governance team",
      stoppages: "Workflow operativo",
      maintenances: "Controllo flotta",
      deadlines: "Controllo flotta",
      calendar: "Integrazioni"
    };
    const map = new Map<string, typeof steps>();
    for (const step of steps) {
      const groupName = groupMap[step.key] ?? "Operativita";
      const group = map.get(groupName) ?? [];
      group.push(step);
      map.set(groupName, group);
    }
    return Array.from(map.entries());
  }, [steps]);

  const progressPercent = Number(kpis.completionRate ?? 0);

  if (onboarding.loading) return <p className="text-sm text-muted-foreground">Caricamento setup guidato...</p>;
  if (onboarding.error || !onboarding.data) return <p className="text-sm text-destructive">{onboarding.error ?? "Checklist non disponibile."}</p>;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-indigo-200/50 bg-gradient-to-br from-indigo-50/75 via-background to-violet-50/55 p-4 shadow-[0_22px_46px_-30px_rgba(79,70,229,0.42)] dark:border-indigo-500/30 dark:from-indigo-500/12 dark:via-background dark:to-violet-500/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/45 bg-indigo-100/55 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              Setup Execution Board
            </div>
            <h3 className="text-lg font-semibold text-foreground">{kpis.isReady ? "Tenant pronto al go-live" : "Onboarding in esecuzione"}</h3>
            <p className="text-sm text-muted-foreground">
              Supervisione unica su dati base, governance team, workflow fermi e controllo flotta.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "border px-3 py-1 text-xs uppercase tracking-[0.08em]",
                kpis.isReady
                  ? "border-emerald-300/70 bg-emerald-100/70 text-emerald-700 dark:border-emerald-500/45 dark:bg-emerald-500/15 dark:text-emerald-200"
                  : "border-amber-300/70 bg-amber-100/70 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200"
              )}
            >
              {kpis.isReady ? "Ready" : "In progress"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setReloadKey((old) => old + 1)}>
              Aggiorna
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-border/75 bg-background/80 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Completati</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{kpis.completed}/{kpis.total}</p>
        </article>
        <article className="rounded-xl border border-border/75 bg-background/80 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Pendenti</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{pendingCount}</p>
        </article>
        <article className="rounded-xl border border-border/75 bg-background/80 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Avanzamento</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{progressPercent}%</p>
        </article>
        <article className="rounded-xl border border-border/75 bg-background/80 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Prossima azione</p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{nextStep?.title ?? "Checklist completa"}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-border/70 bg-background/85 p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          <span>Completamento operativo</span>
          <span>{kpis.completed}/{kpis.total}</span>
        </div>
        <div className="h-3 rounded-full bg-muted/70 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 transition-all duration-500"
            style={{ width: `${Math.max(6, progressPercent)}%` }}
          />
        </div>
      </section>

      <div className="space-y-3">
        {groupedSections.map(([sectionName, sectionSteps]) => (
          <section key={sectionName} className="overflow-hidden rounded-2xl border border-border/75 bg-background/85">
            <header className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{sectionName}</p>
              <p className="text-xs text-muted-foreground">
                {sectionSteps.filter((step) => step.completed).length}/{sectionSteps.length} completati
              </p>
            </header>
            <div className="divide-y divide-border/60">
              {sectionSteps.map((step, index) => {
                const Icon = stepIconMap[step.key] ?? Target;
                const route = stepRouteMap[step.key] ?? "/dashboard";
                return (
                  <div key={step.key} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border",
                          step.completed
                            ? "border-emerald-300/70 bg-emerald-100/70 text-emerald-700 dark:border-emerald-500/45 dark:bg-emerald-500/15 dark:text-emerald-200"
                            : "border-border/80 bg-muted/55 text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Step {index + 1}</p>
                        <p className="text-sm font-semibold text-foreground">{step.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock4 className="h-3 w-3" />
                          {step.progressLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {step.completed ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/70 bg-emerald-100/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/45 dark:bg-emerald-500/15 dark:text-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Completato
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/65 bg-amber-100/65 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/12 dark:text-amber-200">
                          <CircleDashed className="h-3.5 w-3.5" />
                          Da completare
                        </span>
                      )}
                      <Button size="sm" className="min-w-[132px]" variant={step.completed ? "outline" : "default"} onClick={() => openRoute(route)}>
                        {step.completed ? "Apri modulo" : "Completa step"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
