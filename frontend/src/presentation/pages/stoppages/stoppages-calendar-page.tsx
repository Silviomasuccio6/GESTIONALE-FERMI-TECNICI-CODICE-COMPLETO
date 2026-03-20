import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { stoppageStatusLabel } from "../../../domain/constants/stoppage-status";
import { stoppagesUseCases } from "../../../application/usecases/stoppages-usecases";
import { StoppageQuickPanel } from "../../components/stoppages/stoppage-quick-panel";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useAsync } from "../../hooks/use-async";

type CalendarView = "day" | "week" | "month" | "agenda";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  priority?: string;
  site?: string;
  workshop?: string;
};

type DaySegment = {
  event: CalendarEvent;
  startAt: Date;
  endAt: Date;
  top: number;
  height: number;
};

const weekdayLabels = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const HOURS = Array.from({ length: 24 }, (_, idx) => idx);
const HOUR_SLOT_PX = 56;
const DAY_GRID_HEIGHT = HOUR_SLOT_PX * HOURS.length;

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};


const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeek = (date: Date) => {
  const d = startOfDay(date);
  const offset = (d.getDay() + 6) % 7;
  return addDays(d, -offset);
};

const getMonthGrid = (focusDate: Date) => {
  const monthStart = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
  const firstDayOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = addDays(monthStart, -firstDayOffset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) days.push(addDays(gridStart, i));
  return { gridStart, gridEnd: days[days.length - 1], days };
};

const monthTitle = (date: Date) =>
  date
    .toLocaleDateString("it-IT", { month: "long", year: "numeric" })
    .replace(/^./, (x) => x.toUpperCase());

const dayTitle = (date: Date) =>
  date.toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

const weekTitle = (days: Date[]) =>
  `${days[0].toLocaleDateString("it-IT", { day: "2-digit", month: "short" })} – ${days[6].toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })}`;

const timeLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

const normalizeEventTimes = (event: CalendarEvent) => {
  const startAt = new Date(event.start);
  const rawEnd = new Date(event.end);
  const endAt = rawEnd > startAt ? rawEnd : new Date(startAt.getTime() + 30 * 60000);
  return { startAt, endAt };
};

const buildDaySegments = (events: CalendarEvent[], day: Date): DaySegment[] => {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);

  return events
    .map((event) => {
      const { startAt, endAt } = normalizeEventTimes(event);
      if (endAt <= dayStart || startAt >= dayEnd) return null;
      const segmentStart = startAt < dayStart ? dayStart : startAt;
      const segmentEnd = endAt > dayEnd ? dayEnd : endAt;
      const startMinutes = (segmentStart.getTime() - dayStart.getTime()) / 60000;
      const durationMinutes = Math.max(30, (segmentEnd.getTime() - segmentStart.getTime()) / 60000);
      return {
        event,
        startAt: segmentStart,
        endAt: segmentEnd,
        top: startMinutes * (HOUR_SLOT_PX / 60),
        height: Math.max(32, durationMinutes * (HOUR_SLOT_PX / 60))
      };
    })
    .filter((segment): segment is DaySegment => Boolean(segment))
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
};

export const StoppagesCalendarPage = () => {
  const [view, setView] = useState<CalendarView>("month");
  const [focusDate, setFocusDate] = useState(() => startOfDay(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()));
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"detail" | "edit" | "create">("detail");
  const [refreshKey, setRefreshKey] = useState(0);

  const monthGrid = useMemo(() => getMonthGrid(focusDate), [focusDate]);
  const weekStart = useMemo(() => startOfWeek(focusDate), [focusDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const range = useMemo(() => {
    if (view === "month" || view === "agenda") {
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

  const events = useMemo<CalendarEvent[]>(() => (data?.data ?? []) as CalendarEvent[], [data]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const { startAt, endAt } = normalizeEventTimes(event);
      for (let cursor = startOfDay(startAt); cursor <= startOfDay(endAt); cursor = addDays(cursor, 1)) {
        const key = formatDateKey(cursor);
        map.set(key, [...(map.get(key) ?? []), event]);
      }
    });
    return map;
  }, [events]);

  const agendaEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const aStart = new Date(a.start).getTime();
        const bStart = new Date(b.start).getTime();
        return aStart - bStart;
      }),
    [events]
  );

  const todayKey = formatDateKey(new Date());

  const weekSegments = useMemo(() => {
    const map = new Map<string, DaySegment[]>();
    weekDays.forEach((day) => {
      map.set(formatDateKey(day), buildDaySegments(events, day));
    });
    return map;
  }, [events, weekDays]);

  const daySegments = useMemo(() => buildDaySegments(events, focusDate), [events, focusDate]);

  const periodLabel = useMemo(() => {
    if (view === "month") return monthTitle(focusDate);
    if (view === "week") return `Settimana ${weekTitle(weekDays)}`;
    if (view === "day") return dayTitle(focusDate);
    return `Agenda · ${monthTitle(focusDate)}`;
  }, [focusDate, view, weekDays]);

  const moveRange = (direction: -1 | 1) => {
    if (view === "month" || view === "agenda") setFocusDate((d) => new Date(d.getFullYear(), d.getMonth() + direction, 1));
    else if (view === "week") setFocusDate((d) => addDays(d, 7 * direction));
    else setFocusDate((d) => addDays(d, direction));
  };

  const openDetail = (id: string, mode: "detail" | "edit" = "detail") => {
    setPanelId(id);
    setPanelMode(mode);
    setPanelOpen(true);
  };

  return (
    <section className="flex min-h-[calc(100vh-7.25rem)] flex-col gap-3">
      <div className="rounded-2xl border bg-card px-3 py-3 sm:px-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => moveRange(-1)} aria-label="Periodo precedente">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFocusDate(startOfDay(new Date()))}>
              Oggi
            </Button>
            <Button variant="outline" size="icon" onClick={() => moveRange(1)} aria-label="Periodo successivo">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Calendario operativo</p>
            <h1 className="text-lg font-semibold sm:text-xl">{periodLabel}</h1>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            <div className="flex items-center rounded-xl border p-1">
              {([
                ["day", "Giorno"],
                ["week", "Settimana"],
                ["month", "Mese"],
                ["agenda", "Agenda"]
              ] as Array<[CalendarView, string]>).map(([value, label]) => (
                <Button key={value} size="sm" variant={view === value ? "default" : "ghost"} onClick={() => setView(value)}>
                  {label}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => {
                setPanelId(null);
                setPanelMode("create");
                setPanelOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nuovo promemoria
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border bg-card p-2 sm:p-3">
        {loading ? <p className="p-4 text-sm text-muted-foreground">Caricamento calendario...</p> : null}
        {error ? <p className="p-4 text-sm text-destructive">{error}</p> : null}

        {!loading && !error && view === "month" ? (
          <div className="grid h-full min-h-[680px] grid-rows-[auto,1fr] gap-2">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
              {weekdayLabels.map((label) => (
                <div key={label} className="rounded-md bg-muted/40 py-2">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid h-full grid-cols-7 grid-rows-6 gap-1">
              {monthGrid.days.map((day) => {
                const key = formatDateKey(day);
                const dayEvents = eventsByDay.get(key) ?? [];
                const inMonth = day.getMonth() === focusDate.getMonth();
                const selected = selectedDateKey === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedDateKey(key);
                      setFocusDate(day);
                    }}
                    className={[
                      "min-h-0 overflow-hidden rounded-lg border p-2 text-left",
                      inMonth ? "bg-card" : "bg-muted/20 text-muted-foreground",
                      selected ? "ring-2 ring-primary" : "hover:bg-muted/35",
                      key === todayKey ? "border-primary/60" : "border-border/70"
                    ].join(" ")}
                  >
                    <p className="mb-1 text-xs font-semibold">{day.getDate()}</p>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <button
                          key={`${event.id}-${event.start}`}
                          type="button"
                          className="w-full truncate rounded bg-primary/10 px-1.5 py-0.5 text-left text-[10px] text-primary hover:bg-primary/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(event.id, "detail");
                          }}
                        >
                          {event.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 ? <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} altri</p> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {!loading && !error && view === "week" ? (
          <div className="h-full overflow-auto">
            <div className="min-w-[1040px]">
              <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b bg-card">
                <div className="h-11 border-r" />
                {weekDays.map((day) => {
                  const key = formatDateKey(day);
                  return (
                    <div key={key} className={`h-11 border-r px-2 py-1 ${key === todayKey ? "bg-primary/10" : ""}`}>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{day.toLocaleDateString("it-IT", { weekday: "short" })}</p>
                      <p className="text-sm font-semibold">{day.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
                <div className="relative border-r" style={{ height: DAY_GRID_HEIGHT }}>
                  {HOURS.map((hour) => (
                    <div key={hour} className="absolute left-0 right-0 border-t text-[11px] text-muted-foreground" style={{ top: hour * HOUR_SLOT_PX }}>
                      <span className="-translate-y-1/2 bg-card pr-1">{timeLabel(hour)}</span>
                    </div>
                  ))}
                </div>

                {weekDays.map((day) => {
                  const key = formatDateKey(day);
                  const segments = weekSegments.get(key) ?? [];
                  return (
                    <div key={key} className="relative border-r" style={{ height: DAY_GRID_HEIGHT }}>
                      {HOURS.map((hour) => (
                        <div key={hour} className="absolute left-0 right-0 border-t border-muted/60" style={{ top: hour * HOUR_SLOT_PX }} />
                      ))}

                      {segments.length === 0 ? (
                        <p className="absolute left-2 top-2 text-[11px] text-muted-foreground">Nessun evento</p>
                      ) : (
                        segments.map((segment) => (
                          <button
                            key={`${segment.event.id}-${segment.startAt.toISOString()}-${segment.endAt.toISOString()}`}
                            type="button"
                            className="absolute left-1 right-1 rounded-md border border-primary/30 bg-primary/12 px-2 py-1 text-left text-[11px] text-primary hover:bg-primary/20"
                            style={{ top: segment.top, height: segment.height }}
                            onClick={() => openDetail(segment.event.id, "detail")}
                          >
                            <p className="truncate font-semibold">{segment.event.title}</p>
                            <p className="truncate opacity-80">{segment.event.workshop}</p>
                          </button>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {!loading && !error && view === "day" ? (
          <div className="h-full overflow-auto">
            <div className="grid min-w-[640px] grid-cols-[80px_minmax(0,1fr)] border rounded-lg">
              <div className="border-r bg-card" />
              <div className="px-3 py-2 text-sm font-semibold">{dayTitle(focusDate)}</div>

              <div className="relative border-r" style={{ height: DAY_GRID_HEIGHT }}>
                {HOURS.map((hour) => (
                  <div key={hour} className="absolute left-0 right-0 border-t text-[11px] text-muted-foreground" style={{ top: hour * HOUR_SLOT_PX }}>
                    <span className="-translate-y-1/2 bg-card pr-1">{timeLabel(hour)}</span>
                  </div>
                ))}
              </div>

              <div className="relative" style={{ height: DAY_GRID_HEIGHT }}>
                {HOURS.map((hour) => (
                  <div key={hour} className="absolute left-0 right-0 border-t border-muted/60" style={{ top: hour * HOUR_SLOT_PX }} />
                ))}

                {daySegments.length === 0 ? (
                  <p className="absolute left-3 top-3 text-sm text-muted-foreground">Nessun fermo attivo in questa giornata.</p>
                ) : (
                  daySegments.map((segment) => (
                    <button
                      key={`${segment.event.id}-${segment.startAt.toISOString()}-${segment.endAt.toISOString()}`}
                      type="button"
                      className="absolute left-2 right-2 rounded-lg border border-primary/35 bg-primary/12 px-3 py-2 text-left text-sm text-primary hover:bg-primary/20"
                      style={{ top: segment.top, height: segment.height }}
                      onClick={() => openDetail(segment.event.id, "detail")}
                    >
                      <p className="truncate font-semibold">{segment.event.title}</p>
                      <p className="truncate text-xs opacity-80">{segment.event.site} · {segment.event.workshop}</p>
                      <p className="text-[11px] opacity-80">{stoppageStatusLabel[segment.event.status] ?? segment.event.status}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}

        {!loading && !error && view === "agenda" ? (
          <div className="h-full overflow-auto rounded-lg border">
            {agendaEvents.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nessun evento nel periodo selezionato.</p>
            ) : (
              <div className="divide-y">
                {agendaEvents.map((event) => {
                  const startAt = new Date(event.start);
                  const endAt = new Date(event.end);
                  return (
                    <button
                      key={`${event.id}-${event.start}`}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-muted/30"
                      onClick={() => openDetail(event.id, "detail")}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{event.title}</p>
                        <Badge variant="outline" className="text-[10px] uppercase">{stoppageStatusLabel[event.status] ?? event.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {startAt.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "long" })} · {startAt.toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                        {" "}→{" "}
                        {endAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs text-muted-foreground">{event.site} · {event.workshop}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
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
