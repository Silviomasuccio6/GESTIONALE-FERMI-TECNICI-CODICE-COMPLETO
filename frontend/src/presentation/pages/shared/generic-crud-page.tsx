import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { PageHeader } from "../../components/layout/page-header";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

type Props = {
  title: string;
  list: (params: Record<string, string | number | undefined>) => Promise<{ data: any[] }>;
  create: (input: Record<string, unknown>) => Promise<unknown>;
  update: (id: string, input: Record<string, unknown>) => Promise<unknown>;
  remove: (id: string) => Promise<void>;
  fields: Array<{
    key: string;
    label: string;
    type?: "text" | "email" | "number";
    placeholder?: string;
  }>;
};

export const GenericCrudPage = ({ title, list, create, update, remove, fields }: Props) => {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const reload = () => list({ page: 1, pageSize: 50 }).then((res) => setRows(res.data)).catch((e) => setError((e as Error).message));

  useEffect(() => { reload(); }, []);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const data = new FormData(formEl);
    const payload: Record<string, unknown> = {};
    fields.forEach((field) => {
      const value = data.get(field.key);
      if (value !== null && value !== "") payload[field.key] = value;
    });
    await create(payload);
    formEl.reset();
    setPanelOpen(false);
    reload();
  };

  const onUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;
    const data = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    fields.forEach((field) => {
      const value = data.get(field.key);
      if (value !== null) payload[field.key] = value;
    });
    await update(editingId, payload);
    setEditingId(null);
    setPanelOpen(false);
    reload();
  };

  return (
    <section className="space-y-4">
      <PageHeader title={title} subtitle="Gestione anagrafica con inserimento rapido, ricerca e cancellazione record." />
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditingId(null);
            setPanelOpen(true);
          }}
        >
          Nuovo record
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Elenco</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Ricerca..." value={search} onChange={(e) => setSearch(e.target.value)} />

          <div className="space-y-3 md:hidden">
            {rows
              .filter((row) =>
                !search.trim()
                  ? true
                  : JSON.stringify(row).toLowerCase().includes(search.trim().toLowerCase())
              )
              .map((row) => (
                <Card key={row.id} className="border-dashed">
                  <CardContent className="space-y-2 pt-4">
                    {fields.map((f) => (
                      <p key={f.key} className="text-sm">
                        <span className="text-muted-foreground">{f.label}: </span>
                        <span className="font-medium">{String(row[f.key] ?? "-")}</span>
                      </p>
                    ))}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingId(row.id);
                        setPanelOpen(true);
                      }}>Modifica</Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(row.id).then(reload)}>Elimina</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  {fields.map((f) => <TableHead key={f.key}>{f.label}</TableHead>)}
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows
                  .filter((row) =>
                    !search.trim()
                      ? true
                      : JSON.stringify(row).toLowerCase().includes(search.trim().toLowerCase())
                  )
                  .map((row) => (
                    <TableRow key={row.id}>
                      {fields.map((f) => <TableCell key={f.key}>{String(row[f.key] ?? "")}</TableCell>)}
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingId(row.id);
                            setPanelOpen(true);
                          }}>Modifica</Button>
                          <Button size="sm" variant="destructive" onClick={() => remove(row.id).then(reload)}>Elimina</Button>
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
              <p className="text-sm font-semibold">{editingId ? "Modifica record" : "Nuovo record"}</p>
              <Button variant="outline" size="icon" onClick={() => setPanelOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-[calc(100%-64px)] overflow-auto px-4 py-4">
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={editingId ? onUpdate : onCreate}>
                {fields.map((field) => (
                  <div key={field.key} className="grid gap-1.5">
                    <Label>{field.label}</Label>
                    <Input
                      name={field.key}
                      type={field.type ?? "text"}
                      defaultValue={editingId ? String(rows.find((x) => x.id === editingId)?.[field.key] ?? "") : ""}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2 flex gap-2">
                  <Button type="submit">{editingId ? "Salva modifiche" : "Crea record"}</Button>
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
