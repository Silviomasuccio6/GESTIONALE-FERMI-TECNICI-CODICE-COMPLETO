import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Inbox, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { FleetumInlineLoader } from "../../components/brand/fleetum-logo-loader";
import { PageHeader } from "../../components/layout/page-header";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

type Props = {
  title: string;
  createLabel?: string;
  createTitleLabel?: string;
  list: (params: Record<string, string | number | undefined>) => Promise<{ data: any[]; total: number }>;
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

const PAGE_SIZE = 20;

export const GenericCrudPage = ({
  title,
  createLabel = "Nuovo record",
  createTitleLabel,
  list,
  create,
  update,
  remove,
  fields
}: Props) => {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const load = async (targetPage: number, targetSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await list({
        page: targetPage,
        pageSize: PAGE_SIZE,
        search: targetSearch || undefined
      });
      const nextTotal = typeof result.total === "number" ? result.total : result.data.length;
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      if (targetPage > nextTotalPages) {
        setPage(nextTotalPages);
        return;
      }
      setRows(result.data);
      setTotal(nextTotal);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const reload = async () => {
    await load(page, searchQuery);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void load(page, searchQuery);
  }, [page, searchQuery]);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formEl = event.currentTarget;
    const data = new FormData(formEl);
    const payload: Record<string, unknown> = {};
    fields.forEach((field) => {
      const value = data.get(field.key);
      if (value !== null && value !== "") payload[field.key] = value;
    });

    try {
      await create(payload);
      formEl.reset();
      setPanelOpen(false);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;
    setError(null);
    const data = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    fields.forEach((field) => {
      const value = data.get(field.key);
      if (value !== null) payload[field.key] = value;
    });

    try {
      await update(editingId, payload);
      setEditingId(null);
      setPanelOpen(false);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Vuoi eliminare definitivamente questo record?")) return;
    setError(null);
    try {
      await remove(id);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const editingRow = editingId ? rows.find((x) => x.id === editingId) : null;

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Anagrafiche"
        title={title}
        subtitle="Consulta, cerca e aggiorna i dati operativi da un unico spazio ordinato."
        actions={
          <Button
            onClick={() => {
              setEditingId(null);
              setPanelOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {createLabel}
          </Button>
        }
      />

      {error ? (
        <div role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card className="saas-surface overflow-hidden">
        <CardHeader className="flex-row items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <CardTitle className="text-sm font-semibold">Elenco {title.toLowerCase()}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{total} {total === 1 ? "record" : "record"} disponibili</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div className="relative max-w-md">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={`Cerca in ${title}`}
              className="pl-9"
              placeholder={`Cerca in ${title.toLowerCase()}...`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {loading ? <FleetumInlineLoader label="Caricamento in corso" /> : null}

          {!loading && rows.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground">
                <Inbox className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold text-foreground">{searchQuery ? "Nessun risultato trovato" : "Nessun record presente"}</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                {searchQuery ? "Prova con un termine diverso o cancella la ricerca." : `Crea il primo record per iniziare a gestire ${title.toLowerCase()}.`}
              </p>
              {!searchQuery ? (
                <Button className="mt-4" size="sm" onClick={() => setPanelOpen(true)}>
                  <Plus className="h-4 w-4" />
                  {createLabel}
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2 md:hidden">
            {rows.map((row) => (
              <Card key={row.id} className="shadow-none">
                <CardContent className="space-y-2 p-4">
                  {fields.map((f) => (
                    <p key={f.key} className="text-sm">
                      <span className="text-muted-foreground">{f.label}: </span>
                      <span className="font-medium">{String(row[f.key] ?? "-")}</span>
                    </p>
                  ))}
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(row.id);
                        setPanelOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Modifica
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => void onDelete(row.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Elimina
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className={rows.length ? "hidden md:block" : "hidden"}>
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow>
                  {fields.map((f) => (
                    <TableHead key={f.key}>{f.label}</TableHead>
                  ))}
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    {fields.map((f) => (
                      <TableCell key={f.key}>{String(row[f.key] ?? "")}</TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            setEditingId(row.id);
                            setPanelOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifica
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 px-2 text-[11px]" onClick={() => void onDelete(row.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          Elimina
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
            <p className="text-muted-foreground">
              Pagina <span className="font-medium text-foreground">{page}</span> di <span className="font-medium text-foreground">{totalPages}</span> · Totale record: <span className="font-medium text-foreground">{total}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Precedente
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Successiva
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {panelOpen ? (
        <>
          <div className="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[2px]" onClick={() => setPanelOpen(false)} />
          <aside className="fixed right-0 top-0 z-[80] h-full w-full max-w-lg border-l bg-card shadow-[-20px_0_50px_-30px_rgba(15,23,42,0.35)] max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[90vh] max-sm:rounded-t-2xl max-sm:border-l-0 max-sm:border-t">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-sm font-semibold">{editingId ? "Modifica record" : createTitleLabel ?? createLabel}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Compila i campi e salva per aggiornare l'elenco.</p>
              </div>
              <Button aria-label="Chiudi pannello" variant="ghost" size="icon" onClick={() => setPanelOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-[calc(100%-73px)] overflow-auto px-5 py-5">
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={editingId ? onUpdate : onCreate}>
                {fields.map((field) => (
                  <div key={field.key} className="grid gap-1.5">
                    <Label>{field.label}</Label>
                    <Input
                      name={field.key}
                      type={field.type ?? "text"}
                      defaultValue={editingRow ? String(editingRow[field.key] ?? "") : ""}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
                <div className="sticky bottom-0 -mx-5 mt-3 flex gap-2 border-t bg-card/95 px-5 pb-1 pt-4 backdrop-blur sm:col-span-2">
                  <Button type="submit">{editingId ? "Salva modifiche" : `Crea ${createLabel.toLowerCase().replace(/^nuov[oa]\s+/i, "")}`}</Button>
                  <Button type="button" variant="outline" onClick={() => setPanelOpen(false)}>
                    Annulla
                  </Button>
                </div>
              </form>
            </div>
          </aside>
        </>
      ) : null}
    </section>
  );
};
