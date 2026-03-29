import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { stoppageStatusLabel } from "../../../domain/constants/stoppage-status";
import { stoppagesUseCases } from "../../../application/usecases/stoppages-usecases";
import { StoppageQuickPanel } from "../../components/stoppages/stoppage-quick-panel";
import { PageHeader } from "../../components/layout/page-header";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAsync } from "../../hooks/use-async";

type CalendarView = "month" | "week" | "day";
const weekdayLabels = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);
const parseDateKey = (dateKey: string) => new Date(`${dateKey}T00:00:00`);

const monthTitle = (date: Date) =>
  date.toLocaleDateString("it-IT", { month: "long", year: "numeric" }).replace(/^./, (x) => x.toUpperCase());

const dayTitle = (date: Date) => date.toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

const startOfWeek = (date: Date) => {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getMonthGrid = (focusDate: Date) => {
  const monthStart = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
  const firstDayOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = addDays(monthStart, -firstDayOffset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) days.push(addDays(gridStart, i));
  return { gridStart, gridEnd: days[days.length - 1], days };
};

export const StoppagesCalendarPage = () => {
  const [view, setView] = useState<CalendarView>("month");
  const [focusDate, setFocusDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()));
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"detail" | "edit" | "create">("detail");
  const [refreshKey, setRefreshKey] = useState(0);

  const monthGrid = useMemo(() => getMonthGrid(focusDate), [focusDate]);
  const weekStart = useMemo(() => startOfWeek(focusDate), [focusDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const range = useMemo(() => {
    if (view === "month") {
      return {
        from: new Date(`${formatDateKey(monthGrid.gridStart)}T00:00:00`).toISOString(),
        to: new Date(`${formatDateKey(monthGrid.gridEnd)}T23:59:59`).toISOString()
      };
    }
    if (view === "week") {
      return {
        from: new Date(`${formatDateKey(weekStart)}T00:00:00`).toISOString(),
        to: new Date(`${formatDateKey(addDays(weekStart, 6))}T23:59:59`).toISOString()
      };
    }
    return {
      from: new Date(`${formatDateKey(focusDate)}T00:00:00`).toISOString(),
      to: new Date(`${formatDateKey(focusDate)}T23:59:59`).toISOString()
    };
  }, [focusDate, monthGrid.gridEnd, monthGrid.gridStart, view, weekStart]);

  const { data, loading, error } = useAsync(
    () => stoppagesUseCases.calendar({ dateFrom: range.from, dateTo: range.to }),
    [range.from, range.to, refreshKey]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    (data?.data ?? []).forEach((event: any) => {
      const start = parseDateKey(formatDateKey(new Date(event.start)));
      const end = parseDateKey(formatDateKey(new Date(event.end)));
      for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
        const key = formatDateKey(cursor);
        map.set(key, [...(map.get(key) ?? []), event]);
      }
    });
    return map;
  }, [data]);

  const selectedEvents = eventsByDay.get(selectedDateKey) ?? [];
  const todayKey = formatDateKey(new Date());

  const moveRange = (direction: -1 | 1) => {
    if (view === "month") setFocusDate((d) => new Date(d.getFullYear(), d.getMonth() + direction, 1));
    else if (view === "week") setFocusDate((d) => addDays(d, 7 * direction));
    else setFocusDate((d) => addDays(d, direction));
  };

  if (loading) return <p className="text-sm text-muted-foreground">Caricamento calendario...</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <section className="space-y-4">
      <PageHeader
        title="Calendario Fermi"
        subtitle="Vista operativa completa con modalità Mese, Settimana e Giorno."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border p-1">
              <Button size="sm" variant={view === "day" ? "default" : "ghost"} onClick={() => setView("day")}>Giorno</Button>
              <Button size="sm" variant={view === "week" ? "default" : "ghost"} onClick={() => setView("week")}>Settimana</Button>
              <Button size="sm" variant={view === "month" ? "default" : "ghost"} onClick={() => setView("month")}>Mese</Button>
            </div>
            <Button variant="outline" size="icon" onClick={() => moveRange(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => moveRange(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFocusDate(new Date())}>Oggi</Button>
          </div>
        }
      />

      {view === "month" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{monthTitle(focusDate)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
              {weekdayLabels.map((label) => <div key={label} className="rounded-md bg-muted/40 py-1">{label}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthGrid.days.map((day) => {
                const key = formatDateKey(day);
                const dayEvents = eventsByDay.get(key) ?? [];
                const inMonth = day.getMonth() === focusDate.getMonth();
                const selected = selectedDateKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDateKey(key)}
                    className={[
                      "min-h-28 rounded-md border p-1 text-left transition",
                      inMonth ? "bg-card" : "bg-muted/20 text-muted-foreground",
                      selected ? "ring-2 ring-primary" : "hover:bg-muted/40",
                      key === todayKey ? "border-primary/60" : "border-border/70"
                    ].join(" ")}
                  >
                    <p className="mb-1 text-xs font-semibold">{day.getDate()}</p>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event: any) => (
                        <button
                          key={`${event.id}-${event.start}`}
                          type="button"
                          className="w-full truncate rounded bg-primary/10 px-1 py-0.5 text-left text-[10px] text-primary hover:bg-primary/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPanelId(event.id);
                            setPanelMode("detail");
                            setPanelOpen(true);
                          }}
                        >
                          {event.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 ? <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} altri</p> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {view === "week" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Settimana {weekDays[0].toLocaleDateString("it-IT")} - {weekDays[6].toLocaleDateString("it-IT")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-7">
            {weekDays.map((day) => {
              const key = formatDateKey(day);
              const dayEvents = eventsByDay.get(key) ?? [];
              return (
                <div key={key} className={`rounded-lg border p-2 ${key === todayKey ? "border-primary/70" : ""}`}>
                  <p className="text-xs font-semibold">{day.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit" })}</p>
                  <div className="mt-2 space-y-1">
                    {dayEvents.length === 0 ? <p className="text-[11px] text-muted-foreground">Nessun evento</p> : null}
                    {dayEvents.map((event: any) => (
                      <button
                        key={`${event.id}-${event.start}`}
                        type="button"
                        className="w-full rounded bg-primary/10 px-1.5 py-1 text-left text-[11px] text-primary hover:bg-primary/20"
                        onClick={() => {
                          setPanelId(event.id);
                          setPanelMode("detail");
                          setPanelOpen(true);
                        }}
                      >
                        <p className="truncate font-semibold">{event.title}</p>
                        <p className="truncate opacity-80">{event.workshop}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {view === "day" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{dayTitle(focusDate)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(eventsByDay.get(formatDateKey(focusDate)) ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun fermo attivo in questa giornata.</p>
            ) : (
              (eventsByDay.get(formatDateKey(focusDate)) ?? []).map((event: any) => (
                <div key={`${event.id}-${event.start}`} className="rounded-lg border p-3">
                  <p className="text-sm font-semibold">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{event.site} · {event.workshop}</p>
                  <p className="text-xs text-muted-foreground">{stoppageStatusLabel[event.status] ?? event.status}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setPanelId(event.id); setPanelMode("detail"); setPanelOpen(true); }}>
                      Dettaglio
                    </Button>
                    <Button size="sm" onClick={() => { setPanelId(event.id); setPanelMode("edit"); setPanelOpen(true); }}>
                      Modifica
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {view === "month" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventi del {parseDateKey(selectedDateKey).toLocaleDateString("it-IT")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun evento in questa data.</p>
            ) : (
              selectedEvents.map((event: any) => (
                <button
                  key={`${event.id}-${event.start}`}
                  type="button"
                  className="w-full rounded-lg border p-2 text-left hover:bg-muted/30"
                  onClick={() => {
                    setPanelId(event.id);
                    setPanelMode("detail");
                    setPanelOpen(true);
                  }}
                >
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.site} · {event.workshop}</p>
                  <p className="text-xs text-muted-foreground">{stoppageStatusLabel[event.status] ?? event.status}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setPanelId(event.id); setPanelMode("detail"); setPanelOpen(true); }}>
                      Dettaglio
                    </Button>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); setPanelId(event.id); setPanelMode("edit"); setPanelOpen(true); }}>
                      Modifica
                    </Button>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

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
