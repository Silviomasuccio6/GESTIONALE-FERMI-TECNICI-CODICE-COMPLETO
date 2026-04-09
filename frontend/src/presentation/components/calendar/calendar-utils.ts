import { CalendarEvent, PositionedEvent } from "./calendar-types";

export const DAY_MINUTES = 24 * 60;
export const DAY_GRID_HEIGHT = 1200;
export const HOUR_HEIGHT = DAY_GRID_HEIGHT / 24;

export const pad2 = (value: number) => String(value).padStart(2, "0");

export const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
};

export const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export const addMinutes = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + amount);
  return next;
};

export const parseEventStart = (event: CalendarEvent) => {
  const parsed = new Date(`${event.date}T${event.start}:00`);
  return Number.isNaN(parsed.getTime()) ? new Date(`${event.date}T00:00:00`) : parsed;
};

export const parseEventEnd = (event: CalendarEvent) => {
  const parsedStart = parseEventStart(event);
  const parsedEnd = new Date(`${event.date}T${event.end}:00`);
  if (Number.isNaN(parsedEnd.getTime())) return addMinutes(parsedStart, 60);
  if (parsedEnd <= parsedStart) return addMinutes(parsedEnd, DAY_MINUTES);
  return parsedEnd;
};

export const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();

export const timeToY = (hourMinute: string) => {
  const [hRaw, mRaw] = hourMinute.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  const minutes = Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : 0;
  return (minutes / DAY_MINUTES) * DAY_GRID_HEIGHT;
};

export const minutesToTime = (minutes: number) => {
  const clamped = Math.max(0, Math.min(DAY_MINUTES - 1, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${pad2(h)}:${pad2(m)}`;
};

export const timeRangeLabel = (event: CalendarEvent) => {
  if (event.allDay) return "Intera giornata";
  return `${event.start} - ${event.end}`;
};

export const toMinuteValue = (value: string) => {
  const [hRaw, mRaw] = value.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
};

export const formatMonthTitle = (date: Date) =>
  date
    .toLocaleDateString("it-IT", { month: "long", year: "numeric" })
    .replace(/^./, (letter) => letter.toUpperCase());

export const formatDayTitle = (date: Date) =>
  date
    .toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    })
    .replace(/^./, (letter) => letter.toUpperCase());

export const getMonthGridDays = (monthDate: Date) => {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayPad = (monthStart.getDay() + 6) % 7;
  const gridStart = addDays(monthStart, -mondayPad);
  return Array.from({ length: 42 }, (_, idx) => addDays(gridStart, idx));
};

export const intersectsDay = (event: CalendarEvent, day: Date) => {
  if (event.allDay) {
    const eventStart = startOfDay(parseEventStart(event));
    return toDateKey(eventStart) === toDateKey(startOfDay(day));
  }

  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  const eventStart = parseEventStart(event);
  const eventEnd = parseEventEnd(event);
  return eventEnd > dayStart && eventStart < dayEnd;
};

const sliceEventIntoDayWindow = (event: CalendarEvent, day: Date) => {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  const eventStart = parseEventStart(event);
  const eventEnd = parseEventEnd(event);

  const segStart = eventStart < dayStart ? dayStart : eventStart;
  const segEnd = eventEnd > dayEnd ? dayEnd : eventEnd;
  const startMin = minutesOfDay(segStart);
  const endMin = Math.max(startMin + 15, minutesOfDay(segEnd));

  return { startMin, endMin };
};

export const positionDayEvents = (events: CalendarEvent[], day: Date): PositionedEvent[] => {
  const timed = events.filter((event) => !event.allDay && intersectsDay(event, day));

  const segments = timed
    .map((event) => {
      const { startMin, endMin } = sliceEventIntoDayWindow(event, day);
      return {
        event,
        startMin,
        endMin,
        column: 0,
        columnCount: 1
      };
    })
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const active: Array<{ endMin: number; column: number }> = [];
  for (const segment of segments) {
    for (let idx = active.length - 1; idx >= 0; idx -= 1) {
      if (active[idx].endMin <= segment.startMin) active.splice(idx, 1);
    }

    const usedColumns = new Set(active.map((entry) => entry.column));
    let nextColumn = 0;
    while (usedColumns.has(nextColumn)) nextColumn += 1;

    segment.column = nextColumn;
    active.push({ endMin: segment.endMin, column: nextColumn });
  }

  for (const segment of segments) {
    const overlapping = segments.filter(
      (candidate) => segment.startMin < candidate.endMin && segment.endMin > candidate.startMin
    );
    segment.columnCount = Math.max(1, ...overlapping.map((entry) => entry.column + 1));
  }

  return segments.map((segment) => {
    const width = 100 / segment.columnCount;
    const left = width * segment.column;
    const top = (segment.startMin / DAY_MINUTES) * DAY_GRID_HEIGHT;
    const height = Math.max(28, ((segment.endMin - segment.startMin) / DAY_MINUTES) * DAY_GRID_HEIGHT);

    return {
      event: segment.event,
      top,
      height,
      left,
      width,
      column: segment.column,
      columnCount: segment.columnCount
    };
  });
};

export const getNowLineTop = () => {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return (mins / DAY_MINUTES) * DAY_GRID_HEIGHT;
};

export const weekdayLabelsShort = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
export const weekdayLabelsMini = ["L", "M", "M", "G", "V", "S", "D"];
