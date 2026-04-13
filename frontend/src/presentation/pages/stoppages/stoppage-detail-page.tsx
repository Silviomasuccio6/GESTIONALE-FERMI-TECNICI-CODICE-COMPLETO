import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { stoppageStatusOptions } from "../../../domain/constants/stoppage-status";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { PageHeader } from "../../components/layout/page-header";
import { StoppageStatusBadge } from "../../components/stoppages/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAsync } from "../../hooks/use-async";
import { stoppagesUseCases } from "../../../application/usecases/stoppages-usecases";
import { snackbar } from "../../../application/stores/snackbar-store";
import { AuthenticatedPhoto } from "../../components/common/authenticated-photo";

export const StoppageDetailPage = () => {
  const { id = "" } = useParams();
  const safeId = id.trim();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsync(
    () => (safeId ? stoppagesUseCases.getById(safeId) : Promise.reject(new Error("Fermo non valido"))),
    [safeId, refreshKey]
  );
  const events = useAsync(() => (safeId ? stoppagesUseCases.events(safeId) : Promise.resolve({ data: [] } as any)), [safeId, refreshKey]);
  const partsOrders = useAsync(
    () => (safeId ? stoppagesUseCases.listPartsOrders(safeId) : Promise.resolve({ data: [] } as any)),
    [safeId, refreshKey]
  );
  const approvals = useAsync(
    () => (safeId ? stoppagesUseCases.listCostApprovals(safeId) : Promise.resolve({ requests: [], decisions: [] } as any)),
    [safeId, refreshKey]
  );
  const costsVariance = useAsync(() => stoppagesUseCases.costsVariance(), [safeId, refreshKey]);
  const escalations = useAsync(() => stoppagesUseCases.slaEscalations(), [safeId, refreshKey]);
  const [nextStatus, setNextStatus] = useState("IN_PROGRESS");
  const [template, setTemplate] = useState<any>(null);
  const [partsForm, setPartsForm] = useState({ description: "", supplier: "", etaDate: "", estimatedCost: "" });
  const [approvalForm, setApprovalForm] = useState({ estimatedTotalCost: "", reason: "", note: "" });
  const [finalCost, setFinalCost] = useState("");
  const [reasonDraft, setReasonDraft] = useState("");
  const [updateDraft, setUpdateDraft] = useState("");

  const escalation = (escalations.data?.data ?? []).find((x: any) => x.id === id);
  const variance = (costsVariance.data?.data ?? []).find((x: any) => x.stoppageId === id);
  const refreshData = () => setRefreshKey((value) => value + 1);

  const normalizeCostInput = (raw: string) => raw.trim().replace(/\s+/g, "").replace(",", ".");

  const saveFinalCostValue = async (raw: string, silent = false) => {
    const normalized = normalizeCostInput(raw);
    if (!normalized) {
      throw new Error("Inserisci il costo consuntivo prima di chiudere il fermo.");
    }
    const numeric = Number(normalized);
    if (!Number.isFinite(numeric) || numeric < 0) {
      throw new Error("Costo consuntivo non valido. Inserisci un importo numerico >= 0.");
    }
    await stoppagesUseCases.setFinalCost(safeId, numeric);
    setFinalCost(String(numeric));
    if (!silent) snackbar.success("Costo consuntivo salvato.");
    return numeric;
  };

  useEffect(() => {
    if (!data) return;
    setReasonDraft(String(data.reason ?? ""));
    setNextStatus(String(data.status ?? "OPEN"));
  }, [data?.id, data?.reason, data?.status]);

  if (loading) return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <section className="space-y-4">
      <PageHeader
        title={`Dettaglio fermo ${data.vehicle.plate}`}
        subtitle="Storico completo: stato, timeline eventi, reminder inviati e documentazione foto."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Azioni Operative Rapide</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-[220px_1fr]">
          <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
            {stoppageStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </Select>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await stoppagesUseCases.updateStatus(safeId, nextStatus as any);
                snackbar.success(`Stato aggiornato: ${stoppageStatusOptions.find((x) => x.value === nextStatus)?.label ?? nextStatus}`);
                refreshData();
              }}
            >
              Salva stato
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await stoppagesUseCases.sendEmailReminder(safeId);
                snackbar.success("Reminder email inviato.");
                refreshData();
              }}
            >
              Invia reminder email
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const res = await stoppagesUseCases.reminderTemplatePreview(safeId, "EMAIL");
                setTemplate(res.email);
              }}
            >
              Preview template email
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const res = await stoppagesUseCases.reminderTemplatePreview(safeId, "WHATSAPP");
                setTemplate({ subject: "WhatsApp", body: res.whatsapp.message });
              }}
            >
              Preview template WhatsApp
            </Button>
          </div>
          {template ? (
            <div className="md:col-span-2 rounded-md border p-2 text-sm">
              <p className="font-medium">{template.subject}</p>
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{template.body}</pre>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-2">
          <p><b>Targa:</b> {data.vehicle.plate}</p>
          <p><b>Veicolo:</b> {data.vehicle.brand} {data.vehicle.model}</p>
          <p><b>Sede:</b> {data.site.name}</p>
          <p><b>Officina:</b> {data.workshop.name}</p>
          <p><b>Stato:</b> <StoppageStatusBadge status={data.status} /></p>
          <p><b>Priorità:</b> {data.priority || "-"}</p>
          <p><b>Aperto il:</b> {data.openedAt ? new Date(data.openedAt).toLocaleString("it-IT") : "-"}</p>
          <p><b>Chiuso il:</b> {data.closedAt ? new Date(data.closedAt).toLocaleString("it-IT") : "-"}</p>
          <p><b>Assegnato a:</b> {data.assignedToUserId || "-"}</p>
          <p><b>Costo stimato/giorno:</b> {data.estimatedCostPerDay ? `€ ${data.estimatedCostPerDay}` : "-"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Motivo e Aggiornamenti Operativi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5">
            <Label>Motivo fermo</Label>
            <Textarea value={reasonDraft} onChange={(e) => setReasonDraft(e.target.value)} rows={3} />
            <div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const reason = reasonDraft.trim();
                  if (reason.length < 3) {
                    snackbar.error("Il motivo deve contenere almeno 3 caratteri.");
                    return;
                  }
                  await stoppagesUseCases.update(safeId, { reason });
                  snackbar.success("Motivo fermo aggiornato.");
                  refreshData();
                }}
              >
                Salva motivo
              </Button>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Aggiungi aggiornamento</Label>
            <Textarea
              value={updateDraft}
              onChange={(e) => setUpdateDraft(e.target.value)}
              rows={3}
              placeholder="Es.: Veicolo preso in carico dall'officina, attesa ricambi prevista 48h..."
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  const message = updateDraft.trim();
                  if (message.length < 2) {
                    snackbar.error("Scrivi un aggiornamento valido prima di salvare.");
                    return;
                  }
                  await stoppagesUseCases.addOperationalUpdate(safeId, message);
                  setUpdateDraft("");
                  snackbar.success("Aggiornamento operativo salvato.");
                  refreshData();
                }}
              >
                Salva aggiornamento
              </Button>
              <span className="text-xs text-muted-foreground">Gli aggiornamenti vengono aggiunti anche nella timeline eventi.</span>
            </div>
          </div>

          <div className="rounded-md border bg-background/70 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Note operative correnti</p>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{data.notes || "Nessun aggiornamento ancora registrato."}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Approvazioni costo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Importo da approvare (€)</Label>
                <Input
                  type="number"
                  min={0}
                  value={approvalForm.estimatedTotalCost}
                  onChange={(e) => setApprovalForm((s) => ({ ...s, estimatedTotalCost: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label>Motivo</Label>
                <Textarea value={approvalForm.reason} onChange={(e) => setApprovalForm((s) => ({ ...s, reason: e.target.value }))} />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label>Note</Label>
                <Textarea value={approvalForm.note} onChange={(e) => setApprovalForm((s) => ({ ...s, note: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  await stoppagesUseCases.requestCostApproval(safeId, {
                    estimatedTotalCost: Number(approvalForm.estimatedTotalCost || 0),
                    reason: approvalForm.reason,
                    note: approvalForm.note || undefined
                  });
                  snackbar.success("Richiesta approvazione inviata.");
                  refreshData();
                }}
              >
                Richiedi approvazione
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await stoppagesUseCases.decideCostApproval(safeId, {
                    approved: true,
                    approvedCost: Number(approvalForm.estimatedTotalCost || 0),
                    reason: approvalForm.note || "Approvato"
                  });
                  snackbar.success("Costo approvato.");
                  refreshData();
                }}
              >
                Approva
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  await stoppagesUseCases.decideCostApproval(safeId, {
                    approved: false,
                    reason: approvalForm.note || "Rifiutato"
                  });
                  snackbar.success("Approvazione rifiutata.");
                  refreshData();
                }}
              >
                Rifiuta
              </Button>
            </div>
            <div className="space-y-2">
              {(approvals.data?.requests ?? []).slice(0, 5).map((row: any) => (
                <div key={row.id} className="rounded-md border p-2 text-xs">
                  <p className="font-semibold">Richiesta € {row.estimatedTotalCost}</p>
                  <p className="text-muted-foreground">{new Date(row.createdAt).toLocaleString("it-IT")} · {row.reason}</p>
                </div>
              ))}
              {(approvals.data?.decisions ?? []).slice(0, 5).map((row: any) => (
                <div key={row.id} className="rounded-md border p-2 text-xs">
                  <p className="font-semibold">{row.approved ? "Approvato" : "Rifiutato"} {row.approvedCost ? `· € ${row.approvedCost}` : ""}</p>
                  <p className="text-muted-foreground">{new Date(row.createdAt).toLocaleString("it-IT")} · {row.reason || "-"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Costi e scostamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p><b>Stimato:</b> {variance ? `€ ${variance.estimated}` : "-"}</p>
              <p><b>Consuntivo:</b> {variance ? `€ ${variance.actual}` : "-"}</p>
              <p><b>Scostamento:</b> {variance ? `€ ${variance.variance}` : "-"}</p>
              <p><b>Scost. %:</b> {variance ? `${variance.varianceRate}%` : "-"}</p>
            </div>
            <div className="grid gap-1.5">
              <Label>Imposta costo consuntivo (€)</Label>
              <Input type="number" min={0} value={finalCost} onChange={(e) => setFinalCost(e.target.value)} />
            </div>
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await saveFinalCostValue(finalCost);
                  refreshData();
                } catch (costError) {
                  snackbar.error((costError as Error).message);
                }
              }}
            >
              Salva consuntivo
            </Button>
            {escalation ? (
              <p className="rounded-md border border-amber-400/50 bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                Escalation SLA attiva: <b>{escalation.escalation}</b> · {escalation.daysOpen} gg aperto (soglia {escalation.thresholdDays} gg)
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Nessuna escalation SLA attiva su questo fermo.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline eventi</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {(events.data?.data ?? []).map((event: any) => (
              <li key={event.id} className="rounded-md border p-2">
                <p className="font-medium">{event.message}</p>
                <p className="text-muted-foreground">{new Date(event.createdAt).toLocaleString()} · {event.type}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ordini ricambi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-1.5 md:col-span-2">
              <Label>Descrizione</Label>
              <Input value={partsForm.description} onChange={(e) => setPartsForm((s) => ({ ...s, description: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Fornitore</Label>
              <Input value={partsForm.supplier} onChange={(e) => setPartsForm((s) => ({ ...s, supplier: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>ETA</Label>
              <Input type="date" value={partsForm.etaDate} onChange={(e) => setPartsForm((s) => ({ ...s, etaDate: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Costo stimato (€)</Label>
              <Input type="number" min={0} value={partsForm.estimatedCost} onChange={(e) => setPartsForm((s) => ({ ...s, estimatedCost: e.target.value }))} />
            </div>
          </div>
          <Button
            size="sm"
            onClick={async () => {
              await stoppagesUseCases.addPartsOrder(safeId, {
                description: partsForm.description,
                supplier: partsForm.supplier || undefined,
                etaDate: partsForm.etaDate || undefined,
                estimatedCost: Number(partsForm.estimatedCost || 0) || undefined
              });
              snackbar.success("Ordine ricambio registrato.");
              setPartsForm({ description: "", supplier: "", etaDate: "", estimatedCost: "" });
              refreshData();
            }}
          >
            Aggiungi ordine ricambio
          </Button>
          <div className="space-y-2">
            {(partsOrders.data?.data ?? []).map((row: any) => (
              <div key={row.id} className="rounded-md border p-2 text-xs">
                <p className="font-semibold">{row.description}</p>
                <p className="text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString("it-IT")} · Fornitore: {row.supplier || "-"} · ETA: {row.etaDate || "-"} · Costo: {row.estimatedCost ? `€ ${row.estimatedCost}` : "-"}
                </p>
                {row.etaRiskDays && row.etaRiskDays > 0 ? (
                  <p className="text-amber-700 dark:text-amber-300">Ritardo ETA: {row.etaRiskDays} giorni</p>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Storico reminder</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {(data.reminders || []).map((r: any) => (
              <li key={r.id} className="rounded-md border p-2">
                {new Date(r.sentAt).toLocaleString()} - {r.channel} - {r.type} - {r.success ? "OK" : "KO"}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Foto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(data.photos || []).map((p: any) => (
              <AuthenticatedPhoto
                key={p.id}
                photoId={p.id}
                kind="stoppage"
                className="h-40 w-full rounded-md border object-cover"
                alt="foto fermo"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
