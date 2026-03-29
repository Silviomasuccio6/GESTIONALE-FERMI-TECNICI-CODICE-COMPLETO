import { useMemo, useState } from "react";
import { stoppagesUseCases } from "../../../application/usecases/stoppages-usecases";
import { PageHeader } from "../../components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAsync } from "../../hooks/use-async";

const columns = [
  { key: "OPEN", label: "Aperto" },
  { key: "IN_PROGRESS", label: "In lavorazione" },
  { key: "WAITING_PARTS", label: "In attesa ricambi" },
  { key: "SOLICITED", label: "Sollecitato" },
  { key: "CLOSED", label: "Chiuso" }
] as const;

export const StoppagesKanbanPage = () => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const { data, loading, error } = useAsync(() => stoppagesUseCases.list({ page: 1, pageSize: 200 }), [refreshTick]);

  const grouped = useMemo(() => {
    const rows = data?.data ?? [];
    return columns.reduce<Record<string, any[]>>((acc, col) => {
      acc[col.key] = rows.filter((row) => row.status === col.key);
      return acc;
    }, {});
  }, [data]);

  const onDropToColumn = async (status: "OPEN" | "IN_PROGRESS" | "WAITING_PARTS" | "SOLICITED" | "CLOSED" | "CANCELED") => {
    if (!draggedId) return;
    await stoppagesUseCases.updateStatus(draggedId, status);
    setDraggedId(null);
    setRefreshTick((x) => x + 1);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Caricamento kanban...</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <section className="space-y-4">
      <PageHeader
        title="Kanban Fermi"
        subtitle="Sposta i fermi tra gli stati con drag and drop per un aggiornamento operativo rapido."
      />
      <div className="grid gap-4 xl:grid-cols-5">
        {columns.map((column) => (
          <Card
            key={column.key}
            className="min-h-[420px]"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onDropToColumn(column.key)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{column.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(grouped[column.key] ?? []).map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggedId(item.id)}
                  className="cursor-grab rounded-md border bg-muted/40 p-3 text-sm"
                >
                  <p className="font-semibold">{item.vehicle?.plate}</p>
                  <p>{item.vehicle?.brand} {item.vehicle?.model}</p>
                  <p className="text-muted-foreground">{item.site?.name}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
