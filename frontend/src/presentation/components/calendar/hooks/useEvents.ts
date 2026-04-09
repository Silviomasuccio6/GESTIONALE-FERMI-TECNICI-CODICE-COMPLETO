import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { snackbar } from "../../../../application/stores/snackbar-store";
import { stoppagesUseCases } from "../../../../application/usecases/stoppages-usecases";
import { CALS_DEFAULT, CalendarEvent, CalendarItem } from "../calendar-types";
import { addMinutes, minutesToTime, toDateKey, toMinuteValue } from "../calendar-utils";

const CACHE_TTL_MS = 5 * 60 * 1000;
const backendCalendarMap = ["work", "personal", "finance", "dev", "marketing"];

const normalizeColor = (value: unknown, fallback: string) => {
  const candidate = String(value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(candidate) ? candidate : fallback;
};

const mapBackendCalendarId = (value: unknown): number => {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 4) return value;

  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return 0;

  if (/^\d+$/.test(raw)) {
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 4) return parsed;
  }

  const byIndex = backendCalendarMap.indexOf(raw);
  if (byIndex >= 0) return byIndex;

  if (raw.includes("lavor")) return 0;
  if (raw.includes("personal")) return 1;
  if (raw.includes("personale")) return 1;
  if (raw.includes("finance")) return 2;
  if (raw.includes("finanz")) return 2;
  if (raw.includes("dev")) return 3;
  if (raw.includes("svilupp")) return 3;
  if (raw.includes("marketing")) return 4;
  return 0;
};

const toIso = (dateKey: string, hourMinute: string) => new Date(`${dateKey}T${hourMinute}:00`).toISOString();

const ensureEventRange = (event: CalendarEvent): CalendarEvent => {
  if (event.allDay) {
    return { ...event, start: "00:00", end: "23:59" };
  }

  const startMin = toMinuteValue(event.start);
  const endMin = toMinuteValue(event.end);

  if (endMin <= startMin) {
    return { ...event, end: minutesToTime(startMin + 60) };
  }

  return event;
};

const mapCustomRow = (row: Record<string, unknown>): CalendarEvent => {
  const start = new Date(String(row.start ?? row.startAt ?? new Date().toISOString()));
  const endRaw = new Date(String(row.end ?? row.endAt ?? start.toISOString()));
  const end = endRaw > start ? endRaw : addMinutes(start, 60);

  const date = toDateKey(start);
  const startHm = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
  const endHm = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;

  const calId = mapBackendCalendarId(row.calendarId);
  const persistedColor = normalizeColor(row.color, CALS_DEFAULT[calId]?.color ?? CALS_DEFAULT[0].color);
  const color = CALS_DEFAULT[calId]?.color ?? persistedColor;

  return {
    id: `custom:${String(row.id)}`,
    remoteId: String(row.id),
    source: "custom",
    title: String(row.title ?? "Evento"),
    date,
    start: startHm,
    end: endHm,
    calendarId: calId,
    location: String(row.location ?? ""),
    description: String(row.description ?? ""),
    allDay: Boolean(row.allDay),
    color
  };
};

const mapStoppageRow = (row: Record<string, unknown>): CalendarEvent => {
  const start = new Date(String(row.start ?? new Date().toISOString()));
  const rawEnd = new Date(String(row.end ?? addMinutes(start, 60).toISOString()));
  const end = rawEnd > start ? rawEnd : addMinutes(start, 60);

  return {
    id: `stoppage:${String(row.id)}`,
    remoteId: String(row.id),
    source: "stoppage",
    readonly: true,
    title: String(row.title ?? "Fermo"),
    date: toDateKey(start),
    start: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
    end: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
    calendarId: 0,
    location: String(row.site ?? ""),
    description: String(row.workshop ?? ""),
    allDay: false,
    color: CALS_DEFAULT[0].color
  };
};

const eventToBackendPayload = (event: CalendarEvent, calendars: CalendarItem[]) => {
  const normalized = ensureEventRange(event);
  const color = normalized.color ?? calendars[normalized.calendarId]?.color ?? CALS_DEFAULT[0].color;

  return {
    title: normalized.title,
    description: normalized.description ?? "",
    start: toIso(normalized.date, normalized.start),
    end: toIso(normalized.date, normalized.end),
    allDay: Boolean(normalized.allDay),
    location: normalized.location ?? "",
    attendees: [],
    reminder: 30,
    visibility: "default",
    availability: "BUSY",
    type: "EVENT",
    color,
    calendarId: backendCalendarMap[normalized.calendarId] ?? "default"
  };
};

const fetchEventsRange = async (from: Date, to: Date): Promise<CalendarEvent[]> => {
  // TODO: se il backend espone endpoint dedicato /calendar/events, collegare qui la fetch principale.
  const dateFrom = new Date(`${toDateKey(from)}T00:00:00`).toISOString();
  const dateTo = new Date(`${toDateKey(to)}T23:59:59`).toISOString();

  const [stoppagesRes, customRes] = await Promise.all([
    stoppagesUseCases.calendar({ dateFrom, dateTo }),
    stoppagesUseCases.listCustomCalendarEvents({ dateFrom, dateTo }).catch(() => ({ data: [] as Array<Record<string, unknown>> }))
  ]);

  const stoppageEvents = (stoppagesRes?.data ?? []).map((row) => mapStoppageRow(row as Record<string, unknown>));
  const customEvents = (customRes?.data ?? []).map((row) => mapCustomRow(row as Record<string, unknown>));

  return [...customEvents, ...stoppageEvents].sort((a, b) => {
    const aTs = new Date(`${a.date}T${a.start}:00`).getTime();
    const bTs = new Date(`${b.date}T${b.start}:00`).getTime();
    return aTs - bTs;
  });
};

export const useEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarItem[]>(CALS_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheRef = useRef(new Map<string, { ts: number; events: CalendarEvent[] }>());
  const eventsRef = useRef<CalendarEvent[]>([]);
  const calendarsRef = useRef<CalendarItem[]>(CALS_DEFAULT);
  const activeRangeRef = useRef<{ from: Date; to: Date } | null>(null);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    calendarsRef.current = calendars;
  }, [calendars]);

  const setCalendarVisibility = useCallback((calendarId: number, visible: boolean) => {
    setCalendars((prev) => prev.map((item) => (item.id === calendarId ? { ...item, visible } : item)));
  }, []);

  const visibleIds = useMemo(() => new Set(calendars.filter((item) => item.visible).map((item) => item.id)), [calendars]);

  const visibleEvents = useMemo(() => events.filter((event) => visibleIds.has(event.calendarId)), [events, visibleIds]);

  const hasEventsOnDate = useCallback(
    (dateKey: string) =>
      visibleEvents.some((event) => {
        if (event.date === dateKey) return true;

        const start = new Date(`${event.date}T${event.start}:00`);
        const end = new Date(`${event.date}T${event.end}:00`);
        if (end <= start) end.setDate(end.getDate() + 1);

        const dayStart = new Date(`${dateKey}T00:00:00`);
        const dayEnd = new Date(`${dateKey}T23:59:59`);
        return end >= dayStart && start <= dayEnd;
      }),
    [visibleEvents]
  );

  const loadRange = useCallback(async (from: Date, to: Date, force = false) => {
    const rangeKey = `${toDateKey(from)}::${toDateKey(to)}`;
    const now = Date.now();
    activeRangeRef.current = { from, to };

    const cached = cacheRef.current.get(rangeKey);
    if (!force && cached && now - cached.ts < CACHE_TTL_MS) {
      setEvents(cached.events.map((event) => ({ ...event })));
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loaded = await fetchEventsRange(from, to);
      cacheRef.current.set(rangeKey, {
        ts: now,
        events: loaded
      });
      setEvents(loaded);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Errore caricamento eventi";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!activeRangeRef.current) return;
    await loadRange(activeRangeRef.current.from, activeRangeRef.current.to, true);
  }, [loadRange]);

  const addEvent = useCallback(
    async (input: Partial<CalendarEvent>) => {
      const baseDate = input.date ?? toDateKey(new Date());
      const optimistic: CalendarEvent = ensureEventRange({
        id: `tmp:${Date.now()}`,
        source: "custom",
        title: input.title?.trim() || "Nuovo evento",
        date: baseDate,
        start: input.start ?? "09:00",
        end: input.end ?? "10:00",
        calendarId: input.calendarId ?? 0,
        location: input.location ?? "",
        description: input.description ?? "",
        allDay: input.allDay ?? false,
        color: input.color
      });

      const previous = eventsRef.current;
      setEvents((prev) => [optimistic, ...prev]);

      try {
        const payload = eventToBackendPayload(optimistic, calendarsRef.current);
        const createdRes = await stoppagesUseCases.createCustomCalendarEvent(payload);
        const mapped = mapCustomRow((createdRes as any)?.data ?? createdRes ?? {});
        const nextCalendarId = input.calendarId ?? mapped.calendarId;
        const createdWithClientOverrides: CalendarEvent = {
          ...mapped,
          calendarId: nextCalendarId,
          color: CALS_DEFAULT[nextCalendarId]?.color ?? mapped.color
        };

        setEvents((prev) => prev.map((event) => (event.id === optimistic.id ? createdWithClientOverrides : event)));
        cacheRef.current.clear();
        snackbar.success("Evento creato");
        return createdWithClientOverrides;
      } catch (createError) {
        setEvents(previous);
        const message = createError instanceof Error ? createError.message : "Errore creazione evento";
        setError(message);
        snackbar.error(message);
        return null;
      }
    },
    []
  );

  const updateEvent = useCallback(async (eventId: CalendarEvent["id"], patch: Partial<CalendarEvent>) => {
    const target = eventsRef.current.find((event) => String(event.id) === String(eventId));
    if (!target) return false;

    if (target.readonly || target.source === "stoppage") {
      snackbar.info("Questo evento è di sola lettura");
      return false;
    }

    const previous = eventsRef.current;
    const merged = ensureEventRange({ ...target, ...patch });

    setEvents((prev) => prev.map((event) => (String(event.id) === String(eventId) ? merged : event)));

    try {
      const remoteId = target.remoteId ?? String(target.id).replace(/^custom:/, "");
      const payload = eventToBackendPayload(merged, calendarsRef.current);
      const updatedRes = await stoppagesUseCases.updateCustomCalendarEvent(remoteId, payload);
      const mapped = mapCustomRow((updatedRes as any)?.data ?? updatedRes ?? {});
      const nextCalendarId = patch.calendarId ?? merged.calendarId ?? mapped.calendarId;
      const updatedWithClientOverrides: CalendarEvent = {
        ...mapped,
        calendarId: nextCalendarId,
        color: CALS_DEFAULT[nextCalendarId]?.color ?? mapped.color
      };

      setEvents((prev) =>
        prev.map((event) => (String(event.id) === String(eventId) ? updatedWithClientOverrides : event))
      );
      cacheRef.current.clear();
      snackbar.success("Evento aggiornato");
      return true;
    } catch (updateError) {
      setEvents(previous);
      const message = updateError instanceof Error ? updateError.message : "Errore aggiornamento evento";
      setError(message);
      snackbar.error(message);
      return false;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: CalendarEvent["id"]) => {
    const target = eventsRef.current.find((event) => String(event.id) === String(eventId));
    if (!target) return false;

    if (target.readonly || target.source === "stoppage") {
      snackbar.info("Questo evento non può essere eliminato qui");
      return false;
    }

    const previous = eventsRef.current;
    setEvents((prev) => prev.filter((event) => String(event.id) !== String(eventId)));

    try {
      const remoteId = target.remoteId ?? String(target.id).replace(/^custom:/, "");
      await stoppagesUseCases.deleteCustomCalendarEvent(remoteId);
      cacheRef.current.clear();
      snackbar.success("Evento eliminato");
      return true;
    } catch (deleteError) {
      setEvents(previous);
      const message = deleteError instanceof Error ? deleteError.message : "Errore eliminazione evento";
      setError(message);
      snackbar.error(message);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    events,
    visibleEvents,
    calendars,
    loadRange,
    refresh,
    addEvent,
    updateEvent,
    deleteEvent,
    setCalendarVisibility,
    hasEventsOnDate
  };
};
