import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarPlus, Download, RotateCcw } from "lucide-react";
import { masterDataUseCases } from "../../../application/usecases/master-data-usecases";
import { CardStat } from "../../components/common/table";
import { PageHeader } from "../../components/layout/page-header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

type DeadlineRow = {
  vehicleId: string;
  plate: string;
  brand: string;
  model: string;
  siteName: string;
  currentKm: number | null;
  maintenanceIntervalKm: number | null;
  remainingKm: number | null;
  lastRevisionAt: string | null;
  revisionDueAt: string | null;
  daysToRevision: number | null;
  dueByKm: boolean;
  dueSoonByKm: boolean;
  dueByRevision: boolean;
  dueSoonByRevision: boolean;
  status: "SCADUTA" | "IN_SCADENZA" | "OK";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  actions: string[];
};

type DeadlineResponse = {
  kpis: {
    total: number;
    dueNowKm: number;
    dueSoonKm: number;
    dueNowRevision: number;
    dueSoonRevision: number;
    critical: number;
  };
  data: DeadlineRow[];
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("it-IT");
};

const formatMonthYear = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
};

const formatKm = (value?: number | null) => (typeof value === "number" ? value.toLocaleString("it-IT") : "-");
const severityRank: Record<DeadlineRow["severity"], number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};
const severityLabel: Record<DeadlineRow["severity"], string> = {
  CRITICAL: "Critica",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Bassa"
};
const statusLabel: Record<DeadlineRow["status"], string> = {
  SCADUTA: "Scaduta",
  IN_SCADENZA: "In scadenza",
  OK: "OK"
};

const severityBadgeVariant = (severity: DeadlineRow["severity"]) => {
  if (severity === "CRITICAL" || severity === "HIGH") return "destructive";
  if (severity === "MEDIUM") return "warning";
  return "secondary";
};

const getKmStateLabel = (row: DeadlineRow) => {
  if (row.remainingKm === null) return "n.d.";
  if (row.remainingKm <= 0) return `Scaduta di ${Math.abs(row.remainingKm).toLocaleString("it-IT")} km`;
  if (row.dueSoonByKm) return `${row.remainingKm.toLocaleString("it-IT")} km (in scadenza)`;
  return `${row.remainingKm.toLocaleString("it-IT")} km`;
};

const getRevisionStateLabel = (row: DeadlineRow) => {
  if (row.daysToRevision === null) return "n.d.";
  if (row.daysToRevision <= 0) return `Scaduta da ${Math.abs(row.daysToRevision)} gg`;
  if (row.dueSoonByRevision) return `Tra ${row.daysToRevision} gg`;
  return `${row.daysToRevision} gg`;
};

const csvEscape = (value: unknown) => {
  const raw = String(value ?? "");
  const formulaSafe = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${formulaSafe.replace(/"/g, "\"\"")}"`;
};

const matchesDeadlineType = (row: DeadlineRow, type: string) => {
  if (type === "ALL") return true;
  if (type === "KM") return row.dueByKm || row.dueSoonByKm;
  if (type === "REVISION") return row.dueByRevision || row.dueSoonByRevision;
  if (type === "BOTH") return (row.dueByKm || row.dueSoonByKm) && (row.dueByRevision || row.dueSoonByRevision);
  return true;
};

export const VehicleDeadlinesPage = () => {
  const [rows, setRows] = useState<DeadlineRow[]>([]);
  const [kmWarning, setKmWarning] = useState("1000");
  const [revisionWarningDays, setRevisionWarningDays] = useState("30");
  const [includeAll, setIncludeAll] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SCADUTA" | "IN_SCADENZA" | "OK">("ALL");
  const [severityFilter, setSeverityFilter] = useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [deadlineTypeFilter, setDeadlineTypeFilter] = useState<"ALL" | "KM" | "REVISION" | "BOTH">("ALL");
  const [maxDaysFilter, setMaxDaysFilter] = useState("");
  const [maxKmFilter, setMaxKmFilter] = useState("");
  const [sortBy, setSortBy] = useState<"severity_desc" | "revision_asc" | "km_asc" | "plate_asc">("severity_desc");
  const [loading, setLoading] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingFiltered, setSyncingFiltered] = useState(false);
  const [syncingVehicleId, setSyncingVehicleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = (await masterDataUseCases.listVehicleDeadlines({
        kmWarning: Number(kmWarning) || 1000,
        revisionWarningDays: Number(revisionWarningDays) || 30,
        includeAll
      })) as DeadlineResponse;
      setRows(result.data ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [includeAll]);

  const onSyncAll = async () => {
    setSyncingAll(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await masterDataUseCases.syncVehicleDeadlinesCalendar({
        includeSoon: true,
        kmWarning: Number(kmWarning) || 1000,
        revisionWarningDays: Number(revisionWarningDays) || 30
      });
      setSuccess(`Calendario aggiornato: ${result.created} creati, ${result.updated} aggiornati, ${result.removed} rimossi.`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSyncingAll(false);
    }
  };

  const onSyncSingle = async (vehicleId: string) => {
    setSyncingVehicleId(vehicleId);
    setError(null);
    setSuccess(null);
    try {
      const result = await masterDataUseCases.syncVehicleDeadlinesCalendar({
        vehicleIds: [vehicleId],
        includeSoon: true,
        kmWarning: Number(kmWarning) || 1000,
        revisionWarningDays: Number(revisionWarningDays) || 30
      });
      setSuccess(`Veicolo sincronizzato: ${result.created} creati, ${result.updated} aggiornati, ${result.removed} rimossi.`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSyncingVehicleId(null);
    }
  };

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const maxDays = Number(maxDaysFilter);
    const maxKm = Number(maxKmFilter);
    const filtered = rows.filter((row) => {
      if (!includeAll && row.status === "OK") return false;
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (severityFilter !== "ALL" && row.severity !== severityFilter) return false;
      if (!matchesDeadlineType(row, deadlineTypeFilter)) return false;
      if (Number.isFinite(maxDays) && maxDays > 0 && (row.daysToRevision === null || row.daysToRevision > maxDays)) return false;
      if (Number.isFinite(maxKm) && maxKm > 0 && (row.remainingKm === null || row.remainingKm > maxKm)) return false;
      if (!q) return true;
      return (
        row.plate.toLowerCase().includes(q) ||
        row.brand.toLowerCase().includes(q) ||
        row.model.toLowerCase().includes(q) ||
        row.siteName.toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "severity_desc") {
        if (severityRank[b.severity] !== severityRank[a.severity]) return severityRank[b.severity] - severityRank[a.severity];
        const aDays = a.daysToRevision ?? Number.POSITIVE_INFINITY;
        const bDays = b.daysToRevision ?? Number.POSITIVE_INFINITY;
        return aDays - bDays;
      }
      if (sortBy === "revision_asc") {
        const aDays = a.daysToRevision ?? Number.POSITIVE_INFINITY;
        const bDays = b.daysToRevision ?? Number.POSITIVE_INFINITY;
        return aDays - bDays;
      }
      if (sortBy === "km_asc") {
        const aKm = a.remainingKm ?? Number.POSITIVE_INFINITY;
        const bKm = b.remainingKm ?? Number.POSITIVE_INFINITY;
        return aKm - bKm;
      }
      return a.plate.localeCompare(b.plate, "it");
    });
    return sorted;
  }, [rows, query, includeAll, statusFilter, severityFilter, deadlineTypeFilter, maxDaysFilter, maxKmFilter, sortBy]);

  const activeAlerts = useMemo(() => visibleRows.filter((row) => row.status !== "OK"), [visibleRows]);
  const kpiVisible = useMemo(
    () => ({
      total: visibleRows.length,
      dueNowKm: visibleRows.filter((row) => row.dueByKm).length,
      dueSoonKm: visibleRows.filter((row) => !row.dueByKm && row.dueSoonByKm).length,
      dueNowRevision: visibleRows.filter((row) => row.dueByRevision).length,
      dueSoonRevision: visibleRows.filter((row) => !row.dueByRevision && row.dueSoonByRevision).length,
      critical: visibleRows.filter((row) => row.severity === "CRITICAL").length
    }),
    [visibleRows]
  );

  const onSyncFiltered = async () => {
    const vehicleIds = Array.from(new Set(activeAlerts.map((row) => row.vehicleId)));
    if (!vehicleIds.length) {
      setSuccess("Nessun veicolo in alert nei filtri correnti.");
      return;
    }
    setSyncingFiltered(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await masterDataUseCases.syncVehicleDeadlinesCalendar({
        vehicleIds,
        includeSoon: true,
        kmWarning: Number(kmWarning) || 1000,
        revisionWarningDays: Number(revisionWarningDays) || 30
      });
      setSuccess(`Filtri sincronizzati: ${result.created} creati, ${result.updated} aggiornati, ${result.removed} rimossi.`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSyncingFiltered(false);
    }
  };

  const applyQuickFilter = (preset: "CRITICAL" | "REVISION_15" | "KM_500") => {
    setQuery("");
    setIncludeAll(false);
    if (preset === "CRITICAL") {
      setStatusFilter("ALL");
      setSeverityFilter("CRITICAL");
      setDeadlineTypeFilter("ALL");
      setMaxDaysFilter("");
      setMaxKmFilter("");
      setSortBy("severity_desc");
      return;
    }
    if (preset === "REVISION_15") {
      setStatusFilter("ALL");
      setSeverityFilter("ALL");
      setDeadlineTypeFilter("REVISION");
      setMaxDaysFilter("15");
      setMaxKmFilter("");
      setSortBy("revision_asc");
      return;
    }
    setStatusFilter("ALL");
    setSeverityFilter("ALL");
    setDeadlineTypeFilter("KM");
    setMaxDaysFilter("");
    setMaxKmFilter("500");
    setSortBy("km_asc");
  };

  const resetFilters = () => {
    setQuery("");
    setIncludeAll(false);
    setStatusFilter("ALL");
    setSeverityFilter("ALL");
    setDeadlineTypeFilter("ALL");
    setMaxDaysFilter("");
    setMaxKmFilter("");
    setSortBy("severity_desc");
  };

  const onExportFilteredCsv = () => {
    const headers = [
      "Targa",
      "Marca",
      "Modello",
      "Sede",
      "Stato",
      "Severita",
      "Km attuali",
      "Intervallo km",
      "Stato km",
      "Revisione prevista",
      "Stato revisione",
      "Azione consigliata"
    ];
    const lines = [
      headers.map((header) => csvEscape(header)).join(";"),
      ...visibleRows.map((row) =>
        [
          row.plate,
          row.brand,
          row.model,
          row.siteName,
          statusLabel[row.status],
          severityLabel[row.severity],
          formatKm(row.currentKm),
          formatKm(row.maintenanceIntervalKm),
          getKmStateLabel(row),
          formatMonthYear(row.revisionDueAt),
          getRevisionStateLabel(row),
          row.actions.join(" | ")
        ]
          .map((value) => csvEscape(value))
          .join(";")
      )
    ];

    const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `scadenziario_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-3">
      <PageHeader
        title="Scadenziario Veicoli"
        subtitle="Alert su manutenzione chilometrica e revisione con sincronizzazione task nel calendario."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={onExportFilteredCsv} disabled={loading || visibleRows.length === 0}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => void onSyncFiltered()} disabled={syncingFiltered || loading}>
              <CalendarPlus className="h-4 w-4" />
              {syncingFiltered ? "Sync filtri..." : "Sincronizza veicoli filtrati"}
            </Button>
            <Button onClick={() => void onSyncAll()} disabled={syncingAll || loading}>
              <CalendarPlus className="h-4 w-4" />
              {syncingAll ? "Sincronizzazione..." : "Sincronizza tutto nel calendario"}
            </Button>
          </div>
        }
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <div className="g-stats-grid grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <CardStat title="Alert visibili" value={activeAlerts.length} className="h-full" />
        <CardStat title="KM scaduti" value={kpiVisible.dueNowKm} className="h-full" />
        <CardStat title="KM in scadenza" value={kpiVisible.dueSoonKm} className="h-full" />
        <CardStat title="Revisioni scadute" value={kpiVisible.dueNowRevision} className="h-full" />
        <CardStat title="Revisioni in scadenza" value={kpiVisible.dueSoonRevision} className="h-full" />
        <CardStat title="Critici" value={kpiVisible.critical} className="h-full" />
      </div>

      <Card className="saas-surface shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configurazione e filtri operativi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-8" onClick={() => applyQuickFilter("CRITICAL")}>
              Solo critici
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={() => applyQuickFilter("REVISION_15")}>
              Revisione ≤ 15 gg
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={() => applyQuickFilter("KM_500")}>
              Tagliando ≤ 500 km
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={resetFilters}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset filtri
            </Button>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca targa, marca, modello, sede..."
            />
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="ALL">Stato: tutti</option>
              <option value="SCADUTA">Stato: scaduta</option>
              <option value="IN_SCADENZA">Stato: in scadenza</option>
              <option value="OK">Stato: OK</option>
            </Select>
            <Select value={deadlineTypeFilter} onChange={(event) => setDeadlineTypeFilter(event.target.value as typeof deadlineTypeFilter)}>
              <option value="ALL">Tipo alert: tutti</option>
              <option value="KM">Solo km</option>
              <option value="REVISION">Solo revisione</option>
              <option value="BOTH">Km + revisione</option>
            </Select>
            <Select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as typeof severityFilter)}>
              <option value="ALL">Severità: tutte</option>
              <option value="CRITICAL">Critica</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Bassa</option>
            </Select>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
              <option value="severity_desc">Ordina: severità</option>
              <option value="revision_asc">Ordina: revisione più vicina</option>
              <option value="km_asc">Ordina: km residui minori</option>
              <option value="plate_asc">Ordina: targa</option>
            </Select>
            <Input
              type="number"
              min={0}
              value={maxKmFilter}
              onChange={(event) => setMaxKmFilter(event.target.value)}
              placeholder="Km residui max"
            />
            <Input
              type="number"
              min={0}
              value={maxDaysFilter}
              onChange={(event) => setMaxDaysFilter(event.target.value)}
              placeholder="Giorni revisione max"
            />
            <label className="flex h-10 items-center gap-2 rounded-md border border-border/70 px-3 text-xs font-medium text-muted-foreground">
              <input type="checkbox" checked={includeAll} onChange={(event) => setIncludeAll(event.target.checked)} />
              Mostra anche veicoli OK
            </label>
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-[220px_220px_auto]">
            <Input
              type="number"
              min={0}
              value={kmWarning}
              onChange={(event) => setKmWarning(event.target.value)}
              placeholder="Soglia km avviso"
            />
            <Input
              type="number"
              min={0}
              value={revisionWarningDays}
              onChange={(event) => setRevisionWarningDays(event.target.value)}
              placeholder="Giorni avviso revisione"
            />
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              {loading ? "Aggiornamento..." : "Ricalcola scadenziario"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {visibleRows.length === 0 && !loading ? (
        <Card className="saas-surface border-dashed">
          <CardContent className="flex items-center gap-2 pt-5 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Nessuna riga trovata con i filtri correnti.
          </CardContent>
        </Card>
      ) : null}

      <Card className="saas-surface shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Elenco scadenze</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Caricamento in corso...</p> : null}

          <div className="space-y-3 md:hidden">
            {visibleRows.map((row) => (
              <Card key={row.vehicleId} className="border-dashed">
                <CardContent className="space-y-2 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{row.plate}</p>
                    <Badge variant={severityBadgeVariant(row.severity)}>{severityLabel[row.severity]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.brand} {row.model} · {row.siteName}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">KM residui: </span>
                    {getKmStateLabel(row)}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Revisione: </span>
                    {formatMonthYear(row.revisionDueAt)} · {getRevisionStateLabel(row)}
                  </p>
                  <p className="text-xs text-muted-foreground">Ultima revisione: {formatDate(row.lastRevisionAt)}</p>
                  <p className="text-xs text-muted-foreground">{row.actions.join(" · ")}</p>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void onSyncSingle(row.vehicleId)}
                      disabled={syncingVehicleId === row.vehicleId}
                    >
                      {syncingVehicleId === row.vehicleId ? "Sync..." : "Segna nel calendario"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block">
            <Table className="[&_th]:py-1.5 [&_td]:py-1.5 [&_td]:text-[12px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Veicolo</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Km attuali</TableHead>
                  <TableHead>Intervallo</TableHead>
                  <TableHead>Stato KM</TableHead>
                  <TableHead>Revisione</TableHead>
                  <TableHead>Severità</TableHead>
                  <TableHead>Azione</TableHead>
                  <TableHead className="text-right">Calendario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRow key={row.vehicleId}>
                    <TableCell className="font-medium leading-tight">
                      {row.plate}
                      <p className="text-[11px] text-muted-foreground">{row.brand} {row.model}</p>
                    </TableCell>
                    <TableCell className="leading-tight">{row.siteName}</TableCell>
                    <TableCell>{formatKm(row.currentKm)}</TableCell>
                    <TableCell>{formatKm(row.maintenanceIntervalKm)}</TableCell>
                    <TableCell className="leading-tight">
                      {getKmStateLabel(row)}
                    </TableCell>
                    <TableCell className="leading-tight">
                      {formatMonthYear(row.revisionDueAt)} · {getRevisionStateLabel(row)}
                      <p className="text-[11px] text-muted-foreground">Ultima: {formatDate(row.lastRevisionAt)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={severityBadgeVariant(row.severity)}>{severityLabel[row.severity]}</Badge>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{statusLabel[row.status]}</p>
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      <p className="line-clamp-2 text-xs text-muted-foreground">{row.actions.join(" · ")}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => void onSyncSingle(row.vehicleId)}
                        disabled={syncingVehicleId === row.vehicleId}
                      >
                        {syncingVehicleId === row.vehicleId ? "Sync..." : "Segna"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
