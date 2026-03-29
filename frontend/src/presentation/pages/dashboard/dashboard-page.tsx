import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { stoppagesUseCases } from "../../../application/usecases/stoppages-usecases";
import { stoppageStatusLabel } from "../../../domain/constants/stoppage-status";
import { CardStat } from "../../components/common/table";
import { PageHeader } from "../../components/layout/page-header";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAsync } from "../../hooks/use-async";
import { statsUseCases } from "../../../application/usecases/stats-usecases";

type TrendRange = "7d" | "15d" | "30d";

const rangeOptions: Array<{ value: TrendRange; label: string; days: number }> = [
  { value: "7d", label: "7gg", days: 7 },
  { value: "15d", label: "15gg", days: 15 },
  { value: "30d", label: "30gg", days: 30 }
];

const trendViews = [
  {
    title: "Aperture vs Chiusure",
    subtitle: "Confronto giornaliero tra nuovi fermi aperti e chiusi."
  },
  {
    title: "Reminder Inviati",
    subtitle: "Volume reminder inviati nel range selezionato."
  },
  {
    title: "Saldo Aperture-Chiusure",
    subtitle: "Differenza operativa giornaliera tra aperture e chiusure."
  }
] as const;

const formatCurrency = (value?: number | string | null) => {
  const parsed = typeof value === "number" ? value : Number(value ?? NaN);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(parsed);
};

const getRangeBounds = (range: TrendRange) => {
  const today = new Date();
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  const start = new Date(today);
  const days = rangeOptions.find((entry) => entry.value === range)?.days ?? 30;
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return { start, end };
};

export const DashboardPage = () => {
  const [view, setView] = useState<"overview" | "operations" | "activity">("overview");
  const [trendRange, setTrendRange] = useState<TrendRange>("30d");
  const [trendIndex, setTrendIndex] = useState(0);

  const { data, loading, error } = useAsync(() => statsUseCases.dashboard(), []);
  const assignments = useAsync(() => stoppagesUseCases.assignmentSuggestions(), []);
  const costs = useAsync(() => stoppagesUseCases.costsSummary(), []);
  const escalations = useAsync(() => stoppagesUseCases.slaEscalations(), []);
  const preventive = useAsync(() => stoppagesUseCases.preventiveDue({ intervalDays: 180 }), []);
  const variance = useAsync(() => stoppagesUseCases.costsVariance(), []);

  const trendStats = useAsync(() => {
    const { start, end } = getRangeBounds(trendRange);
    return statsUseCases.analytics({
      dateFrom: start.toISOString(),
      dateTo: end.toISOString()
    });
  }, [trendRange]);

  const trendData = useMemo(
    () =>
      (trendStats.data?.charts?.trendStoppages ?? []).map((x: any) => ({
        day: typeof x.day === "string" ? x.day.slice(5) : "-",
        opened: Number(x.opened ?? 0),
        closed: Number(x.closed ?? 0),
        reminders: Number(x.reminders ?? 0),
        balance: Number(x.opened ?? 0) - Number(x.closed ?? 0)
      })),
    [trendStats.data]
  );

  const trendHasData = useMemo(
    () => trendData.some((entry: any) => entry.opened > 0 || entry.closed > 0 || entry.reminders > 0),
    [trendData]
  );

  const activeTrendView = trendViews[trendIndex];
  const activeRangeLabel = rangeOptions.find((entry) => entry.value === trendRange)?.label ?? "30gg";

  const goPrevTrend = () => setTrendIndex((prev) => (prev - 1 + trendViews.length) % trendViews.length);
  const goNextTrend = () => setTrendIndex((prev) => (prev + 1) % trendViews.length);

  if (loading) return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <section className="space-y-4">
      <PageHeader
        title="Dashboard"
        subtitle="Panoramica manageriale: stato generale, priorita operative e attivita recenti."
        actions={
          <>
            <Button variant={view === "overview" ? "default" : "outline"} size="sm" onClick={() => setView("overview")}>
              Overview
            </Button>
            <Button variant={view === "operations" ? "default" : "outline"} size="sm" onClick={() => setView("operations")}>
              Operativita
            </Button>
            <Button variant={view === "activity" ? "default" : "outline"} size="sm" onClick={() => setView("activity")}>
              Attivita Recenti
            </Button>
          </>
        }
      />

      {view === "overview" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CardStat title="Fermi aperti" value={data.kpis.openStoppages} />
            <CardStat title="Critici aperti" value={data.kpis.criticalOpen} />
            <CardStat title="Overdue > 30gg" value={data.kpis.overdueOpen} />
            <CardStat
              title="Costo stimato cumulato"
              value={formatCurrency(costs.data?.kpis?.estimatedTotalCost)}
              valueClassName="font-semibold"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-base">{activeTrendView.title}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{activeTrendView.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border bg-muted/35 p-1">
                    {rangeOptions.map((option) => (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={trendRange === option.value ? "default" : "ghost"}
                        className="h-7 px-3"
                        onClick={() => setTrendRange(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative h-[320px] rounded-xl border bg-background p-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2"
                    aria-label="Trend precedente"
                    onClick={goPrevTrend}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2"
                    aria-label="Trend successivo"
                    onClick={goNextTrend}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <div className="h-full px-9 py-1">
                    {trendStats.loading ? (
                      <div className="grid h-full place-items-center text-sm text-muted-foreground">Caricamento trend...</div>
                    ) : trendStats.error ? (
                      <div className="grid h-full place-items-center text-sm text-destructive">{trendStats.error}</div>
                    ) : !trendHasData ? (
                      <div className="grid h-full place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
                        Nessun dato trend disponibile per {activeRangeLabel}.
                      </div>
                    ) : trendIndex === 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="opened" stroke="#2563eb" strokeWidth={2} name="Aperti" />
                          <Line type="monotone" dataKey="closed" stroke="#059669" strokeWidth={2} name="Chiusi" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : trendIndex === 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData}>
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="reminders" name="Reminder" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="balance" stroke="#d97706" strokeWidth={2} name="Saldo" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Trend {trendIndex + 1}/3 · Range {activeRangeLabel}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {trendViews.map((_, idx) => (
                      <button
                        key={`trend-dot-${idx}`}
                        type="button"
                        onClick={() => setTrendIndex(idx)}
                        aria-label={`Vai al trend ${idx + 1}`}
                        className={`h-2.5 w-2.5 rounded-full transition ${idx === trendIndex ? "bg-primary" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alert prioritari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(data.feeds.alerts || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessun alert prioritario.</p>
                ) : (
                  data.feeds.alerts.slice(0, 6).map((alert: any) => (
                    <div key={alert.id} className="rounded-lg border p-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <Badge variant={alert.severity === "HIGH" ? "destructive" : alert.severity === "MEDIUM" ? "warning" : "secondary"}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.site} · {alert.workshop}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {view === "operations" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CardStat title="Totale fermi" value={data.kpis.totalStoppages} />
            <CardStat title="Nuovi fermi (30gg)" value={data.kpis.newStoppagesLast30} />
            <CardStat title="Chiusi (30gg)" value={data.kpis.closedLast30} />
            <CardStat title="Durata media chiusura" value={`${data.kpis.averageClosureDays} gg`} />
            <CardStat title="Escalation L3" value={escalations.data?.kpis?.level3 ?? 0} />
            <CardStat title="Preventiva gg in scadenza" value={preventive.data?.kpis?.dueSoonDays ?? 0} />
            <CardStat title="Preventiva gg scaduta" value={preventive.data?.kpis?.dueNowDays ?? 0} />
            <CardStat title="Preventiva km in scadenza" value={preventive.data?.kpis?.dueSoonKm ?? 0} />
            <CardStat title="Preventiva km scaduta" value={preventive.data?.kpis?.dueNowKm ?? 0} />
            <CardStat title="Scostamento costi" value={`EUR ${variance.data?.kpis?.varianceTotal ?? 0}`} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Distribuzione stati fermi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.byStatus.map((x: any) => ({ ...x, status: stoppageStatusLabel[x.status] ?? x.status }))}>
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Suggerimenti assegnazione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(assignments.data?.suggestions ?? []).map((item: any) => (
                  <div key={item.userId} className="rounded-lg border p-2">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.email}</p>
                    <p className="text-xs text-muted-foreground">Carico: {item.assignedCount} fermi · peso {item.weightedLoad}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {view === "activity" ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ultimi utenti iscritti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.feeds.recentUsers.map((user: any) => (
                <div key={user.id} className="rounded-lg border p-2">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ultimi fermi creati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.feeds.recentStoppages.map((row: any) => (
                <div key={row.id} className="rounded-lg border p-2">
                  <p className="text-sm font-medium">{row.plate} · {row.brand} {row.model}</p>
                  <p className="text-xs text-muted-foreground">{row.site} · {row.workshop}</p>
                  <p className="text-xs text-muted-foreground">{row.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ultimi reminder inviati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.feeds.recentReminders.map((reminder: any) => (
                <div key={reminder.id} className="rounded-lg border p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{reminder.plate}</p>
                    <Badge variant={reminder.success ? "success" : "destructive"}>{reminder.success ? "OK" : "KO"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{reminder.type} · {reminder.channel}</p>
                  <p className="text-xs text-muted-foreground">{new Date(reminder.sentAt).toLocaleString("it-IT")}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
};
