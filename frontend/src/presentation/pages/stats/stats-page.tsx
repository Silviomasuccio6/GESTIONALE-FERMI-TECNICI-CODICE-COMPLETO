import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { masterDataUseCases } from "../../../application/usecases/master-data-usecases";
import { statsUseCases } from "../../../application/usecases/stats-usecases";
import { stoppageStatusLabel } from "../../../domain/constants/stoppage-status";
import { PageHeader } from "../../components/layout/page-header";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { useAsync } from "../../hooks/use-async";
import { useEntitlements } from "../../hooks/use-entitlements";

const priorityLabel: Record<string, string> = {
  LOW: "Bassa",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Critica"
};

const colors = ["#2563eb", "#059669", "#f59e0b", "#dc2626", "#7c3aed", "#0ea5e9", "#ec4899"];

export const StatsPage = () => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const last90Iso = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(last90Iso);
  const [dateTo, setDateTo] = useState(todayIso);
  const [siteId, setSiteId] = useState("");
  const [workshopId, setWorkshopId] = useState("");
  const [status, setStatus] = useState("");
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [insightView, setInsightView] = useState<"SINTESI" | "OPERATIVO" | "QUALITA" | "DETTAGLIO">("SINTESI");
  const { can } = useEntitlements();
  const canExportCsv = can("export_csv");
  const canSeeSecurityInsights = can("security_insights");

  const masterData = useAsync(
    () => Promise.all([masterDataUseCases.listSites({ page: 1, pageSize: 200 }), masterDataUseCases.listWorkshops({ page: 1, pageSize: 200 })]),
    []
  );

  const stats = useAsync(
    () =>
      statsUseCases.analytics({
        dateFrom: new Date(`${dateFrom}T00:00:00`).toISOString(),
        dateTo: new Date(`${dateTo}T23:59:59`).toISOString(),
        siteId: siteId || undefined,
        workshopId: workshopId || undefined,
        status: status || undefined,
        plate: plate || undefined,
        brand: brand || undefined,
        model: model || undefined
      }),
    [dateFrom, dateTo, siteId, workshopId, status, plate, brand, model, refreshKey]
  );
  const health = useAsync(
    () =>
      statsUseCases.workshopsHealth({
        dateFrom: new Date(`${dateFrom}T00:00:00`).toISOString(),
        dateTo: new Date(`${dateTo}T23:59:59`).toISOString()
      }),
    [dateFrom, dateTo, refreshKey]
  );
  const team = useAsync(
    () =>
      statsUseCases.teamPerformance({
        dateFrom: new Date(`${dateFrom}T00:00:00`).toISOString(),
        dateTo: new Date(`${dateTo}T23:59:59`).toISOString()
      }),
    [dateFrom, dateTo, refreshKey]
  );
  const capacity = useAsync(
    () =>
      statsUseCases.workshopsCapacity({
        dateFrom: new Date(`${dateFrom}T00:00:00`).toISOString(),
        dateTo: new Date(`${dateTo}T23:59:59`).toISOString()
      }),
    [dateFrom, dateTo, refreshKey]
  );
  const ai = useAsync(() => (canSeeSecurityInsights ? statsUseCases.aiSuggestions() : Promise.resolve({ data: [] })), [refreshKey, canSeeSecurityInsights]);

  const sites = masterData.data?.[0]?.data ?? [];
  const workshops = masterData.data?.[1]?.data ?? [];
  const data = stats.data;

  const trendData = useMemo(
    () =>
      (data?.charts?.trendStoppages ?? []).map((x: any) => ({
        ...x,
        day: x.day.slice(5)
      })),
    [data]
  );

  if (stats.loading) return <p className="text-sm text-muted-foreground">Caricamento analytics...</p>;
  if (stats.error)
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{stats.error}</p>
        <Button variant="outline" onClick={() => setRefreshKey((x) => x + 1)}>Riprova</Button>
      </div>
    );

  return (
    <section className="space-y-4">
      <PageHeader
        title="Statistiche"
        subtitle="Vista operativa completa: KPI chiave, trend e alert per monitorare performance e criticità."
        actions={
          <>
            <Button variant={insightView === "SINTESI" ? "default" : "outline"} size="sm" onClick={() => setInsightView("SINTESI")}>Sintesi</Button>
            <Button variant={insightView === "OPERATIVO" ? "default" : "outline"} size="sm" onClick={() => setInsightView("OPERATIVO")}>Operativo</Button>
            <Button variant={insightView === "QUALITA" ? "default" : "outline"} size="sm" onClick={() => setInsightView("QUALITA")}>Qualità</Button>
            <Button variant={insightView === "DETTAGLIO" ? "default" : "outline"} size="sm" onClick={() => setInsightView("DETTAGLIO")}>Dettaglio</Button>
            {canExportCsv ? (
              <Button
                onClick={async () => {
                  const blob = await statsUseCases.downloadAnalyticsCsv({
                    dateFrom: new Date(`${dateFrom}T00:00:00`).toISOString(),
                    dateTo: new Date(`${dateTo}T23:59:59`).toISOString(),
                    siteId: siteId || undefined,
                    workshopId: workshopId || undefined,
                    status: status || undefined,
                    plate: plate || undefined,
                    brand: brand || undefined,
                    model: model || undefined
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtri analitici</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="grid gap-1.5">
            <Label>Dal</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Al</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Sede</Label>
            <Select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              <option value="">Tutte</option>
              {sites.map((site: any) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Officina</Label>
            <Select value={workshopId} onChange={(e) => setWorkshopId(e.target.value)}>
              <option value="">Tutte</option>
              {workshops.map((workshop: any) => (
                <option key={workshop.id} value={workshop.id}>{workshop.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Stato</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tutti</option>
              {Object.entries(stoppageStatusLabel).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Targa</Label>
            <Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="AB123CD" />
          </div>
          <div className="grid gap-1.5">
            <Label>Marca</Label>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Iveco" />
          </div>
          <div className="grid gap-1.5">
            <Label>Modello</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Daily" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Totale fermi</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.kpis.totalStoppages}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Aperti</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.kpis.openStoppages}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Chiusi</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.kpis.closedStoppages}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Critici aperti</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.kpis.criticalOpen}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Durata media</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.kpis.averageClosureDays} gg</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Durata P90</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.kpis.p90ClosureDays} gg</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">SLA 7gg</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.kpis.closureRateWithin7Days}%</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">SLA 30gg</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.kpis.closureRateWithin30Days}%</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">SLA 60gg</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.kpis.closureRateWithin60Days}%</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Reminder totali</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.kpis.remindersTotal}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Reminder successo</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.kpis.reminderSuccessRate}%</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Costo aperti stimato</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">€ {data.kpis.estimatedOpenCost}</p></CardContent></Card>
      </div>

      {insightView === "SINTESI" ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader><CardTitle className="text-base">Trend giornaliero fermi/reminder</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="opened" fill="#2563eb" name="Aperti" />
                    <Bar dataKey="closed" fill="#059669" name="Chiusi" />
                    <Line dataKey="reminders" stroke="#f59e0b" strokeWidth={2} name="Reminder" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Top alert operativi</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(data.tables.longestOpen ?? []).slice(0, 6).map((row: any) => (
                <div key={row.id} className="rounded-lg border p-2">
                  <p className="text-sm font-medium">{row.plate} · {row.openDays} gg</p>
                  <p className="text-xs text-muted-foreground">{row.site} · {row.workshop}</p>
                  <p className="text-xs text-muted-foreground">{priorityLabel[row.priority] ?? row.priority} · {stoppageStatusLabel[row.status] ?? row.status}</p>
                </div>
              ))}
              {(data.tables.longestOpen ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun fermo critico nel periodo.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="xl:col-span-3">
            <CardHeader><CardTitle className="text-base">Distribuzione per stato</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.charts.byStatus.map((x: any) => ({ name: stoppageStatusLabel[x.status] ?? x.status, value: x.count }))}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={105}
                    >
                      {data.charts.byStatus.map((_: any, index: number) => (
                        <Cell key={index} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {insightView === "OPERATIVO" ? (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Health Score Officine</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(health.data?.data ?? []).slice(0, 10).map((item: any) => (
                <div key={item.workshopId} className="rounded-lg border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.workshop}</p>
                    <p className="text-sm font-semibold">{item.healthScore} · {item.grade}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chiusura media {item.averageClosureDays}gg · Closure rate {item.closureRate}% · Reminder KO {item.reminderFailureRate}%
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader><CardTitle className="text-base">KPI Team Operativo</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(team.data?.data ?? []).map((item: any) => (
                  <div key={item.userId} className="rounded-lg border p-2">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Assegnati: {item.assignedTotal} · Chiusi: {item.closedTotal} · Aperti: {item.openTotal} · Durata media: {item.avgClosureDays} gg
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Capacity Officine</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(capacity.data?.data ?? []).slice(0, 10).map((item: any) => (
                  <div key={item.workshopId} className="rounded-lg border p-2">
                    <p className="text-sm font-medium">{item.workshop}</p>
                    <p className="text-xs text-muted-foreground">Attivi: {item.active} · Critici: {item.critical} · Utilizzo: {item.utilizationScore}%</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {insightView === "QUALITA" ? (
        <>
          {canSeeSecurityInsights ? (
            <Card>
              <CardHeader><CardTitle className="text-base">AI Assistant - Suggerimenti priorità</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(ai.data?.data ?? []).slice(0, 12).map((item: any) => (
                  <div key={item.stoppageId} className="rounded-lg border p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{item.plate} · {item.site}</p>
                      <p className="text-sm font-semibold">Risk {item.riskScore}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.workshop} · {stoppageStatusLabel[item.status] ?? item.status} · {item.daysOpen} gg</p>
                    <p className="text-xs">{item.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-base">Distribuzione priorità</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.byPriority.map((x: any) => ({ ...x, priority: priorityLabel[x.priority] ?? x.priority }))}>
                      <XAxis dataKey="priority" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Aging fermi aperti</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.agingBuckets}>
                      <XAxis dataKey="bucket" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Top officine</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.byWorkshop}>
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#059669" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {insightView === "DETTAGLIO" ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Top veicoli per giorni fermo</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.tables.topVehiclesDowntime.map((row: any) => (
                  <div key={`${row.plate}-${row.model}`} className="rounded-lg border p-2">
                    <p className="text-sm font-medium">{row.plate} · {row.brand} {row.model}</p>
                    <p className="text-xs text-muted-foreground">{row.count} fermi · {row.openDays} giorni cumulati</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Fermi aperti più lunghi</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.tables.longestOpen.map((row: any) => (
                  <div key={row.id} className="rounded-lg border p-2">
                    <p className="text-sm font-medium">{row.plate} · {row.brand} {row.model}</p>
                    <p className="text-xs text-muted-foreground">{row.site} · {row.workshop}</p>
                    <p className="text-xs text-muted-foreground">{stoppageStatusLabel[row.status] ?? row.status} · {priorityLabel[row.priority] ?? row.priority} · {row.openDays} gg</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Reminder falliti recenti</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {data.tables.reminderFailures.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun reminder fallito nel periodo filtrato.</p>
              ) : (
                data.tables.reminderFailures.map((row: any) => (
                  <div key={row.id} className="rounded-lg border p-2">
                    <p className="text-sm font-medium">{row.recipient}</p>
                    <p className="text-xs text-muted-foreground">{row.type} · {new Date(row.sentAt).toLocaleString("it-IT")}</p>
                    <p className="text-xs text-destructive">{row.errorMessage || "Errore non specificato"}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </section>
  );
};
