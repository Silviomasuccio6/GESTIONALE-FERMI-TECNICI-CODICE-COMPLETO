import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { masterDataUseCases } from "../../../application/usecases/master-data-usecases";
import { stoppagesUseCases } from "../../../application/usecases/stoppages-usecases";
import { stoppageStatusOptions } from "../../../domain/constants/stoppage-status";
import { EmptyState } from "../../components/common/table";
import { PageHeader } from "../../components/layout/page-header";
import { StoppageQuickPanel } from "../../components/stoppages/stoppage-quick-panel";
import { StoppageStatusBadge } from "../../components/stoppages/status-badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useAsync } from "../../hooks/use-async";

const statusOptions = [{ value: "", label: "Tutti gli stati" }, ...stoppageStatusOptions] as const;

export const StoppagesListPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [siteId, setSiteId] = useState("");
  const [workshopId, setWorkshopId] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("IN_PROGRESS");
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"detail" | "edit" | "create">("detail");
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const masterData = useAsync(
    () => Promise.all([masterDataUseCases.listSites({ page: 1, pageSize: 200 }), masterDataUseCases.listWorkshops({ page: 1, pageSize: 200 })]),
    []
  );

  const { data, loading, error } = useAsync(
    () => stoppagesUseCases.list({ search, status, siteId, workshopId, page, pageSize: 10 }),
    [search, status, siteId, workshopId, page, refreshKey]
  );

  const alerts = useAsync(() => stoppagesUseCases.alerts(), [page, status, siteId, workshopId, search, refreshKey]);

  const rows = useMemo(() => data?.data ?? [], [data]);
  const sites = masterData.data?.[0]?.data ?? [];
  const workshops = masterData.data?.[1]?.data ?? [];

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  const runBulk = async (action: "SET_STATUS" | "SEND_REMINDER") => {
    if (!selectedIds.length) return;
    await stoppagesUseCases.bulkUpdate({
      ids: selectedIds,
      action,
      ...(action === "SET_STATUS" ? { status: bulkStatus as any } : {})
    });
    setSelectedIds([]);
    setRefreshKey((x) => x + 1);
  };

  const onInlineStatusChange = async (id: string, nextStatus: string) => {
    await stoppagesUseCases.updateStatus(id, nextStatus as any);
    setRefreshKey((x) => x + 1);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  if (error)
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Riprova</Button>
      </div>
    );

  return (
    <section className="space-y-4">
      <PageHeader
        title="Gestione Fermi"
        subtitle="Controlla stato, priorità, reminder e assegnazioni da una vista centralizzata."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/fermi/kanban")}>Vista Kanban</Button>
            <Button onClick={() => navigate("/fermi/nuovo")}>Nuovo fermo</Button>
          </>
        }
      />

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Ricerca e filtri</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ricerca per targa, sede, officina..." />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>
          <Select value={siteId} onChange={(e) => setSiteId(e.target.value)}><option value="">Tutte le sedi</option>{sites.map((site: any) => <option key={site.id} value={site.id}>{site.name}</option>)}</Select>
          <Select value={workshopId} onChange={(e) => setWorkshopId(e.target.value)}><option value="">Tutte le officine</option>{workshops.map((workshop: any) => <option key={workshop.id} value={workshop.id}>{workshop.name}</option>)}</Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Azioni massive</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Selezionati: {selectedIds.length}</span>
          <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>{statusOptions.filter((x) => x.value).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>
          <Button variant="outline" onClick={() => runBulk("SET_STATUS")} disabled={!selectedIds.length}>Applica stato</Button>
          <Button variant="secondary" onClick={() => runBulk("SEND_REMINDER")} disabled={!selectedIds.length}>Reminder bulk</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Alert operativi</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(alerts.data?.data ?? []).slice(0, 5).map((alert: any) => (
            <div key={alert.id} className="rounded-md border p-2 text-sm">
              <p className="font-medium">{alert.plate} - {alert.message}</p>
              <p className="text-muted-foreground">{alert.site} / {alert.workshop} · {alert.daysOpen} giorni</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState title="Nessun fermo trovato" />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((item) => (
              <Card key={item.id} className="shadow-sm">
                <CardContent className="space-y-2 pt-4">
                  <p className="text-sm"><span className="text-muted-foreground">Targa: </span><span className="font-semibold">{item.vehicle?.plate}</span></p>
                  <p className="text-sm"><span className="text-muted-foreground">Veicolo: </span>{item.vehicle?.brand} {item.vehicle?.model}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Sede: </span>{item.site?.name}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Officina: </span>{item.workshop?.name}</p>
                  <div><StoppageStatusBadge status={item.status} /></div>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} />Seleziona</label>
                  <Select value={item.status} onChange={(e) => onInlineStatusChange(item.id, e.target.value)}>{statusOptions.filter((x) => x.value).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => {
                      setPanelId(item.id);
                      setPanelMode("detail");
                      setPanelOpen(true);
                    }}>Dettaglio</Button>
                    <Button variant="secondary" size="sm" onClick={() => {
                      setPanelId(item.id);
                      setPanelMode("edit");
                      setPanelOpen(true);
                    }}>Modifica</Button>
                    <Button variant="secondary" size="sm" onClick={async () => {
                      await stoppagesUseCases.sendEmailReminder(item.id);
                      setRefreshKey((x) => x + 1);
                    }}>Reminder</Button>
                    <Button variant="ghost" size="sm" onClick={async () => {
                      const { url } = await stoppagesUseCases.getWhatsappLink(item.id);
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}>WhatsApp</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sede</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Targa</TableHead>
                  <TableHead>Veicolo</TableHead>
                  <TableHead>Officina</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Aggiorna stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.site?.name}</TableCell>
                    <TableCell><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} /></TableCell>
                    <TableCell className="font-medium">{item.vehicle?.plate}</TableCell>
                    <TableCell>{item.vehicle?.brand} {item.vehicle?.model}</TableCell>
                    <TableCell>{item.workshop?.name}</TableCell>
                    <TableCell className="max-w-[260px] truncate">{item.reason}</TableCell>
                    <TableCell><StoppageStatusBadge status={item.status} /></TableCell>
                    <TableCell>
                      <Select value={item.status} onChange={(e) => onInlineStatusChange(item.id, e.target.value)}>{statusOptions.filter((x) => x.value).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setPanelId(item.id);
                          setPanelMode("detail");
                          setPanelOpen(true);
                        }}>Dettaglio</Button>
                        <Button variant="secondary" size="sm" onClick={() => {
                          setPanelId(item.id);
                          setPanelMode("edit");
                          setPanelOpen(true);
                        }}>Modifica</Button>
                        <Button variant="secondary" size="sm" onClick={async () => {
                          await stoppagesUseCases.sendEmailReminder(item.id);
                          setRefreshKey((x) => x + 1);
                        }}>Reminder</Button>
                        <Button variant="ghost" size="sm" onClick={async () => {
                          const { url } = await stoppagesUseCases.getWhatsappLink(item.id);
                          window.open(url, "_blank", "noopener,noreferrer");
                        }}>WhatsApp</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prec.</Button>
        <span className="text-sm text-muted-foreground">Pagina {page}</span>
        <Button variant="outline" size="sm" disabled={(data?.total ?? 0) <= page * 10} onClick={() => setPage((p) => p + 1)}>Succ.</Button>
      </div>

      <StoppageQuickPanel
        open={panelOpen}
        stoppageId={panelId}
        mode={panelMode}
        onClose={() => setPanelOpen(false)}
        onSaved={() => setRefreshKey((x) => x + 1)}
      />
    </section>
  );
};
