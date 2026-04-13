import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { stoppagesUseCases } from "../../../application/usecases/stoppages-usecases";
import { statsUseCases } from "../../../application/usecases/stats-usecases";
import { stoppageStatusLabel } from "../../../domain/constants/stoppage-status";
import { PremiumLockGate } from "../../components/common/premium-lock-gate";
import { CardStat } from "../../components/common/table";
import { PageHeader } from "../../components/layout/page-header";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAsync } from "../../hooks/use-async";
import { useEntitlements } from "../../hooks/use-entitlements";

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

const chartAxisTick = {
  fill: "rgba(13,15,46,0.55)",
  fontSize: 11,
  fontFamily: "JetBrains Mono, monospace"
};

const chartTooltipStyle = {
  background: "rgba(255,255,255,0.96)",
  border: "1px solid rgba(99,102,241,0.2)",
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(99,102,241,0.16)",
  color: "#0D0F2E"
};

const formatCurrency = (value?: number | string | null) => {
  const parsed = typeof value === "number" ? value : Number(value ?? NaN);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(parsed);
};

const getRangeBounds = (range: TrendRange) => {
  const today = new Date();
  const days = rangeOptions.find((entry) => entry.value === range)?.days ?? 30;
  const start = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1), 0, 0, 0, 0));
  const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));

  return { start, end };
};

export const DashboardPage = () => {
  const [view, setView] = useState<"overview" | "operations" | "activity">("overview");
  const [trendRange, setTrendRange] = useState<TrendRange>("30d");
  const [trendIndex, setTrendIndex] = useState(0);
  const [trendLegendFocus, setTrendLegendFocus] = useState<"opened" | "closed" | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const { can, requiredPlan } = useEntitlements();
  const canReportsAdvanced = can("reports_advanced");

  useEffect(() => {
    const onFocus = () => setRefreshTick((value) => value + 1);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const { data, loading, error } = useAsync(() => statsUseCases.dashboard(), [refreshTick]);
  const assignments = useAsync(() => stoppagesUseCases.assignmentSuggestions(), [refreshTick]);
  const costs = useAsync(() => stoppagesUseCases.costsSummary(), [refreshTick]);
  const escalations = useAsync(() => stoppagesUseCases.slaEscalations(), [refreshTick]);
  const preventive = useAsync(() => stoppagesUseCases.preventiveDue({ intervalDays: 180 }), [refreshTick]);
  const variance = useAsync(() => stoppagesUseCases.costsVariance(), [refreshTick]);

  const trendStats = useAsync(() => {
    if (!canReportsAdvanced) {
      return Promise.resolve({
        charts: {
          trendStoppages: []
        }
      });
    }
    const { start, end } = getRangeBounds(trendRange);
    return statsUseCases.analytics({
      dateFrom: start.toISOString(),
      dateTo: end.toISOString()
    });
  }, [canReportsAdvanced, trendRange, refreshTick]);

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
    () => trendData.length > 0,
    [trendData]
  );

  const activeTrendView = trendViews[trendIndex];
  const activeRangeLabel = rangeOptions.find((entry) => entry.value === trendRange)?.label ?? "30gg";

  const goPrevTrend = () => setTrendIndex((prev) => (prev - 1 + trendViews.length) % trendViews.length);
  const goNextTrend = () => setTrendIndex((prev) => (prev + 1) % trendViews.length);
  const getSeriesOpacity = (series: "opened" | "closed") => (!trendLegendFocus || trendLegendFocus === series ? 1 : 0.18);

  const handleTrendLegendEnter = (entry: unknown) => {
    const dataKey = typeof entry === "object" && entry !== null && "dataKey" in entry ? (entry as { dataKey?: unknown }).dataKey : null;
    if (dataKey === "opened" || dataKey === "closed") setTrendLegendFocus(dataKey);
  };

  const handleTrendLegendLeave = () => setTrendLegendFocus(null);

  if (loading && !data) return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  if (error && !data) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <section className="dashboard-enterprise space-y-4">
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
          <div className="g-stats-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-12">
            <CardStat
              className="dashboard-enterprise-kpi xl:col-span-2"
              title="Fermi aperti"
              value={data.kpis.openStoppages}
              extra={<p className="mt-1 text-xs text-muted-foreground">Situazioni operative attive</p>}
            />
            <CardStat
              className="dashboard-enterprise-kpi xl:col-span-2"
              title="Critici aperti"
              value={data.kpis.criticalOpen}
              extra={<p className="mt-1 text-xs text-muted-foreground">Priorita alta da presidiare</p>}
            />
            <CardStat
              className="dashboard-enterprise-kpi xl:col-span-2"
              title="Overdue > 30gg"
              value={data.kpis.overdueOpen}
              extra={<p className="mt-1 text-xs text-muted-foreground">Da riallineare con officine</p>}
            />
            <CardStat
              className="dashboard-enterprise-kpi xl:col-span-2"
              title="Costo stimato cumulato"
              value={formatCurrency(costs.data?.kpis?.estimatedTotalCost)}
              valueClassName="font-semibold"
              extra={<p className="mt-1 text-xs text-muted-foreground">Impatto economico corrente</p>}
            />
            <CardStat
              className="dashboard-enterprise-kpi xl:col-span-2"
              title="Costo medio / giorno fermo"
              value={formatCurrency(costs.data?.kpis?.avgCostPerOpenDay)}
              valueClassName="font-semibold"
              extra={<p className="mt-1 text-xs text-muted-foreground">KPI efficienza operativa</p>}
            />
            <CardStat
              className="dashboard-enterprise-kpi xl:col-span-2"
              title="Costo stimato / km"
              value={costs.data?.kpis?.estimatedCostPerKm ? `${Number(costs.data.kpis.estimatedCostPerKm).toLocaleString("it-IT", { maximumFractionDigits: 4 })} €/km` : "-"}
              valueClassName="font-semibold"
              extra={<p className="mt-1 text-xs text-muted-foreground">Benchmark economico flotta</p>}
            />
          </div>

          <div className="g-charts-row grid gap-4 xl:grid-cols-3">
            <Card className="saas-surface dashboard-enterprise-card xl:col-span-2">
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-base">{activeTrendView.title}</CardTitle>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{activeTrendView.subtitle}</p>
                  </div>
                  <div
                    className={`flex items-center gap-1 rounded-xl border p-1 shadow-[0_12px_26px_-24px_rgba(15,23,42,0.4)] ${
                      canReportsAdvanced
                        ? "border-border/80 bg-background/70"
                        : "border-border/70 bg-muted/40 opacity-75"
                    }`}
                  >
                    {rangeOptions.map((option) => (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={trendRange === option.value ? "default" : "ghost"}
                        className="h-7 px-3"
                        disabled={!canReportsAdvanced}
                        onClick={() => setTrendRange(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PremiumLockGate
                  feature="reports_advanced"
                  locked={!canReportsAdvanced}
                  requiredPlanOverride={requiredPlan("reports_advanced")}
                  title="Trend avanzati bloccati"
                  description="Analisi aperture/chiusure e reminder disponibile dal piano PRO."
                >
                  <div className="saas-chart-shell relative h-[320px] rounded-xl p-2">
                    {canReportsAdvanced ? (
                      <>
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
                      </>
                    ) : null}

                    <div className="h-full px-9 py-1">
                      {!canReportsAdvanced ? (
                        <div className="relative grid h-full place-items-center rounded-lg border border-dashed border-border/75 bg-gradient-to-b from-muted/30 to-muted/10">
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_80%_85%,rgba(99,102,241,0.1),transparent_40%)]" />
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-300">Trend disponibile dal piano PRO</p>
                        </div>
                      ) : trendStats.loading ? (
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
                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(99,102,241,0.12)" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={chartAxisTick} />
                            <YAxis axisLine={false} tickLine={false} tick={chartAxisTick} />
                            <Legend
                              verticalAlign="top"
                              align="left"
                              iconType="circle"
                              wrapperStyle={{ paddingBottom: 8 }}
                              onMouseEnter={handleTrendLegendEnter}
                              onMouseLeave={handleTrendLegendLeave}
                            />
                            <Tooltip
                              cursor={false}
                              isAnimationActive={false}
                              wrapperStyle={{ pointerEvents: "none" }}
                              contentStyle={chartTooltipStyle}
                              labelStyle={{ color: "rgba(13,15,46,0.56)" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="opened"
                              stroke="#2563eb"
                              strokeWidth={trendLegendFocus === "opened" ? 3 : 2}
                              strokeOpacity={getSeriesOpacity("opened")}
                              dot={{ r: 2.5, strokeWidth: 1.2, fill: "#f8fafc", stroke: "#2563eb" }}
                              activeDot={{ r: 4.5, strokeWidth: 1.6, fill: "#ffffff", stroke: "#2563eb" }}
                              name="Aperture fermi"
                            />
                            <Line
                              type="monotone"
                              dataKey="closed"
                              stroke="#059669"
                              strokeWidth={trendLegendFocus === "closed" ? 3 : 2}
                              strokeOpacity={getSeriesOpacity("closed")}
                              dot={{ r: 2.5, strokeWidth: 1.2, fill: "#f8fafc", stroke: "#059669" }}
                              activeDot={{ r: 4.5, strokeWidth: 1.6, fill: "#ffffff", stroke: "#059669" }}
                              name="Chiusure fermi"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : trendIndex === 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={trendData}>
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={chartAxisTick} />
                            <YAxis axisLine={false} tickLine={false} tick={chartAxisTick} />
                            <Tooltip
                              cursor={false}
                              isAnimationActive={false}
                              wrapperStyle={{ pointerEvents: "none" }}
                              contentStyle={chartTooltipStyle}
                              labelStyle={{ color: "rgba(13,15,46,0.56)" }}
                            />
                            <Bar dataKey="reminders" name="Reminder" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={chartAxisTick} />
                            <YAxis axisLine={false} tickLine={false} tick={chartAxisTick} />
                            <Tooltip
                              cursor={false}
                              isAnimationActive={false}
                              wrapperStyle={{ pointerEvents: "none" }}
                              contentStyle={chartTooltipStyle}
                              labelStyle={{ color: "rgba(13,15,46,0.56)" }}
                            />
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
                </PremiumLockGate>
              </CardContent>
            </Card>

            <Card className="saas-surface dashboard-enterprise-card">
              <CardHeader>
                <CardTitle className="text-base">Alert prioritari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(data.feeds.alerts || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessun alert prioritario.</p>
                ) : (
                  data.feeds.alerts.slice(0, 6).map((alert: any) => (
                    <div key={alert.id} className="dashboard-enterprise-item rounded-lg border border-border/80 bg-background/75 p-2">
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
            <CardStat className="dashboard-enterprise-kpi" title="Totale fermi" value={data.kpis.totalStoppages} />
            <CardStat className="dashboard-enterprise-kpi" title="Nuovi fermi (30gg)" value={data.kpis.newStoppagesLast30} />
            <CardStat className="dashboard-enterprise-kpi" title="Chiusi (30gg)" value={data.kpis.closedLast30} />
            <CardStat className="dashboard-enterprise-kpi" title="Durata media chiusura" value={`${data.kpis.averageClosureDays} gg`} />
            <CardStat className="dashboard-enterprise-kpi" title="Escalation L3" value={escalations.data?.kpis?.level3 ?? 0} />
            <CardStat className="dashboard-enterprise-kpi" title="Preventiva gg in scadenza" value={preventive.data?.kpis?.dueSoonDays ?? 0} />
            <CardStat className="dashboard-enterprise-kpi" title="Preventiva gg scaduta" value={preventive.data?.kpis?.dueNowDays ?? 0} />
            <CardStat className="dashboard-enterprise-kpi" title="Preventiva km in scadenza" value={preventive.data?.kpis?.dueSoonKm ?? 0} />
            <CardStat className="dashboard-enterprise-kpi" title="Preventiva km forecast 30gg" value={preventive.data?.kpis?.dueSoonKmForecast30d ?? 0} />
            <CardStat className="dashboard-enterprise-kpi" title="Preventiva km scaduta" value={preventive.data?.kpis?.dueNowKm ?? 0} />
            <CardStat className="dashboard-enterprise-kpi" title="Scostamento costi" value={`EUR ${variance.data?.kpis?.varianceTotal ?? 0}`} />
          </div>

          <div className="g-charts-row grid gap-4 xl:grid-cols-3">
            <Card className="saas-surface dashboard-enterprise-card xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Distribuzione stati fermi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.byStatus.map((x: any) => ({ ...x, status: stoppageStatusLabel[x.status] ?? x.status }))}>
                      <XAxis dataKey="status" axisLine={false} tickLine={false} tick={chartAxisTick} />
                      <YAxis axisLine={false} tickLine={false} tick={chartAxisTick} />
                      <Tooltip
                        cursor={false}
                        isAnimationActive={false}
                        wrapperStyle={{ pointerEvents: "none" }}
                        contentStyle={chartTooltipStyle}
                        labelStyle={{ color: "rgba(13,15,46,0.56)" }}
                      />
                      <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="saas-surface dashboard-enterprise-card">
              <CardHeader>
                <CardTitle className="text-base">Suggerimenti assegnazione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(assignments.data?.suggestions ?? []).map((item: any) => (
                  <div key={item.userId} className="dashboard-enterprise-item rounded-lg border border-border/80 bg-background/75 p-2">
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
          <Card className="saas-surface dashboard-enterprise-card">
            <CardHeader>
              <CardTitle className="text-base">Ultimi utenti iscritti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.feeds.recentUsers.map((user: any) => (
                <div key={user.id} className="dashboard-enterprise-item rounded-lg border border-border/80 bg-background/75 p-2">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="saas-surface dashboard-enterprise-card">
            <CardHeader>
              <CardTitle className="text-base">Ultimi fermi creati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.feeds.recentStoppages.map((row: any) => (
                <div key={row.id} className="dashboard-enterprise-item rounded-lg border border-border/80 bg-background/75 p-2">
                  <p className="text-sm font-medium">{row.plate} · {row.brand} {row.model}</p>
                  <p className="text-xs text-muted-foreground">{row.site} · {row.workshop}</p>
                  <p className="text-xs text-muted-foreground">{row.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="saas-surface dashboard-enterprise-card">
            <CardHeader>
              <CardTitle className="text-base">Ultimi reminder inviati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.feeds.recentReminders.map((reminder: any) => (
                <div key={reminder.id} className="dashboard-enterprise-item rounded-lg border border-border/80 bg-background/75 p-2">
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
