import { FormEvent, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { masterDataUseCases } from "../../../application/usecases/master-data-usecases";
import { PageHeader } from "../../components/layout/page-header";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

export const VehiclesPage = () => {
  const [sites, setSites] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);

  const loadData = async () => {
    setError(null);
    const [sitesRes, vehiclesRes] = await Promise.all([
      masterDataUseCases.listSites({ page: 1, pageSize: 200 }),
      masterDataUseCases.listVehicles({ page: 1, pageSize: 200 })
    ]);
    setSites(sitesRes.data);
    setVehicles(vehiclesRes.data);
  };

  useEffect(() => {
    loadData().catch((e: Error) => setError(e.message));
  }, []);

  const filteredVehicles = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const siteName = (vehicle.site?.name || "").toLowerCase();
      const text = `${vehicle.plate} ${vehicle.brand} ${vehicle.model} ${siteName}`.toLowerCase();
      return text.includes(q);
    });
  }, [vehicles, search]);

  const openCreatePanel = () => {
    setMode("create");
    setEditingVehicle(null);
    setPanelOpen(true);
  };

  const openEditPanel = (vehicle: any) => {
    setMode("edit");
    setEditingVehicle(vehicle);
    setPanelOpen(true);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const form = new FormData(event.currentTarget);

    const payload = {
      siteId: String(form.get("siteId") || "").trim(),
      plate: String(form.get("plate") || "").trim().toUpperCase(),
      brand: String(form.get("brand") || "").trim(),
      model: String(form.get("model") || "").trim(),
      year: String(form.get("year") || "").trim() ? Number(form.get("year")) : null,
      currentKm: String(form.get("currentKm") || "").trim() ? Number(form.get("currentKm")) : null,
      maintenanceIntervalKm: String(form.get("maintenanceIntervalKm") || "").trim() ? Number(form.get("maintenanceIntervalKm")) : null,
      notes: String(form.get("notes") || "").trim()
    };

    if (!payload.siteId || !payload.plate || !payload.brand || !payload.model) {
      setError("Compila sede, targa, marca e modello.");
      return;
    }

    try {
      if (mode === "create") {
        await masterDataUseCases.createVehicle(payload);
        setSuccess(`Veicolo ${payload.plate} creato correttamente.`);
      } else if (editingVehicle) {
        await masterDataUseCases.updateVehicle(editingVehicle.id, payload);
        setSuccess(`Veicolo ${payload.plate} aggiornato correttamente.`);
      }
      setPanelOpen(false);
      setEditingVehicle(null);
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      await masterDataUseCases.deleteVehicle(id);
      setSuccess("Veicolo eliminato.");
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Anagrafiche Veicoli"
        subtitle="Gestione veicoli con ricerca, modifica rapida e allineamento operativo con sedi/officine."
        actions={<Button onClick={openCreatePanel}>Nuovo record</Button>}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Elenco veicoli</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per targa, marca, modello, sede..."
          />

          <div className="space-y-3 md:hidden">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="border-dashed">
                <CardContent className="space-y-2 pt-4">
                  <p className="text-sm"><span className="text-muted-foreground">Targa: </span><span className="font-semibold">{vehicle.plate}</span></p>
                  <p className="text-sm"><span className="text-muted-foreground">Veicolo: </span>{vehicle.brand} {vehicle.model}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Sede: </span>{vehicle.site?.name || "-"}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Anno: </span>{vehicle.year || "-"}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Km attuali: </span>{vehicle.currentKm ?? "-"}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Intervallo manutenzione km: </span>{vehicle.maintenanceIntervalKm ?? "-"}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditPanel(vehicle)}>Modifica</Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(vehicle.id)}>Elimina</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Targa</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modello</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Anno</TableHead>
                  <TableHead>Km attuali</TableHead>
                  <TableHead>Intervallo km</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.plate}</TableCell>
                    <TableCell>{vehicle.brand}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>{vehicle.site?.name || "-"}</TableCell>
                    <TableCell>{vehicle.year || "-"}</TableCell>
                    <TableCell>{vehicle.currentKm ?? "-"}</TableCell>
                    <TableCell>{vehicle.maintenanceIntervalKm ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditPanel(vehicle)}>Modifica</Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(vehicle.id)}>Elimina</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {panelOpen ? (
        <>
          <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm" onClick={() => setPanelOpen(false)} />
          <aside className="fixed z-[80] right-0 top-0 h-full w-full max-w-xl border-l bg-card shadow-2xl max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[88vh] max-sm:rounded-t-2xl max-sm:border-t max-sm:border-l-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold">{mode === "create" ? "Nuovo veicolo" : "Modifica veicolo"}</p>
              <Button variant="outline" size="icon" onClick={() => setPanelOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-[calc(100%-64px)] overflow-auto px-4 py-4">
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
                <div className="grid gap-1.5">
                  <Label>Sede</Label>
                  <Select name="siteId" defaultValue={editingVehicle?.siteId ?? sites[0]?.id ?? ""} required>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>{site.name} - {site.city}</option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Targa</Label>
                  <Input name="plate" defaultValue={editingVehicle?.plate ?? ""} placeholder="AB123CD" required />
                </div>
                <div className="grid gap-1.5">
                  <Label>Marca</Label>
                  <Input name="brand" defaultValue={editingVehicle?.brand ?? ""} placeholder="Iveco" required />
                </div>
                <div className="grid gap-1.5">
                  <Label>Modello</Label>
                  <Input name="model" defaultValue={editingVehicle?.model ?? ""} placeholder="Daily" required />
                </div>
                <div className="grid gap-1.5">
                  <Label>Anno</Label>
                  <Input name="year" type="number" min={1950} max={2100} defaultValue={editingVehicle?.year ?? ""} />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label>Km attuali</Label>
                  <Input name="currentKm" type="number" min={0} defaultValue={editingVehicle?.currentKm ?? ""} />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label>Intervallo manutenzione (km)</Label>
                  <Input name="maintenanceIntervalKm" type="number" min={100} defaultValue={editingVehicle?.maintenanceIntervalKm ?? ""} />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label>Note</Label>
                  <Input name="notes" defaultValue={editingVehicle?.notes ?? ""} placeholder="Note operative" />
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <Button type="submit">{mode === "create" ? "Crea record" : "Salva modifiche"}</Button>
                  <Button type="button" variant="outline" onClick={() => setPanelOpen(false)}>Annulla</Button>
                </div>
              </form>
            </div>
          </aside>
        </>
      ) : null}
    </section>
  );
};
