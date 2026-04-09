import { MouseEvent, PointerEvent, useRef, useState } from "react";
import { CalendarEvent, CalendarItem } from "./calendar-types";
import { DAY_GRID_HEIGHT, addDays, minutesToTime, parseEventEnd, parseEventStart, toDateKey, toMinuteValue } from "./calendar-utils";

type EventBlockProps = {
  event: CalendarEvent;
  calendar: CalendarItem;
  top: number;
  left: number;
  width: number;
  height: number;
  onClick: (event: CalendarEvent, anchorRect: DOMRect) => void;
  onResizeEnd?: (event: CalendarEvent, nextStart: string, nextEnd: string) => void;
  onMoveEnd?: (event: CalendarEvent, nextDate: string, nextStart: string, nextEnd: string) => void;
  allowHorizontalDayShift?: boolean;
};

type EventVisualStatus = "in-progress" | "upcoming" | "today" | "past" | "scheduled";
type ResizeMode = "start" | "end";

const getEventVisualStatus = (event: CalendarEvent): EventVisualStatus => {
  const now = new Date();
  const start = parseEventStart(event);
  const end = parseEventEnd(event);

  if (end.getTime() < now.getTime()) return "past";
  if (start.getTime() <= now.getTime() && end.getTime() >= now.getTime()) return "in-progress";

  const msToStart = start.getTime() - now.getTime();
  if (msToStart > 0 && msToStart <= 2 * 60 * 60 * 1000) return "upcoming";

  const isToday =
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate();
  if (isToday) return "today";

  return "scheduled";
};

const statusLabelMap: Record<EventVisualStatus, string> = {
  "in-progress": "In corso",
  upcoming: "Imminente",
  today: "Oggi",
  past: "Passato",
  scheduled: "Pianificato"
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const roundTo15 = (value: number) => Math.round(value / 15) * 15;
const toMinutesFromPixels = (deltaPx: number) => (deltaPx / DAY_GRID_HEIGHT) * 1440;

export const EventBlock = ({
  event,
  calendar,
  top,
  left,
  width,
  height,
  onClick,
  onResizeEnd,
  onMoveEnd,
  allowHorizontalDayShift = false
}: EventBlockProps) => {
  const [previewTop, setPreviewTop] = useState<number | null>(null);
  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const [previewStart, setPreviewStart] = useState<string | null>(null);
  const [previewEnd, setPreviewEnd] = useState<string | null>(null);
  const [previewShiftX, setPreviewShiftX] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  const suppressClickRef = useRef(false);
  const previewStartRef = useRef<string | null>(null);
  const previewEndRef = useRef<string | null>(null);
  const previewDayShiftRef = useRef(0);

  const currentStartMin = toMinuteValue(event.start);
  const parsedEnd = toMinuteValue(event.end);
  const currentEndMin = parsedEnd > currentStartMin ? parsedEnd : currentStartMin + 60;
  const baseDurationMin = Math.max(15, currentEndMin - currentStartMin);
  const currentStatus = getEventVisualStatus(event);
  const statusLabel = statusLabelMap[currentStatus];

  const effectiveTop = previewTop ?? top;
  const effectiveHeight = previewHeight ?? Math.max(28, height);
  const effectiveStart = previewStart ?? event.start;
  const effectiveEnd = previewEnd ?? event.end;
  const isMutable = !event.allDay && !event.readonly && event.source !== "stoppage";

  const showStatusLabel = effectiveHeight >= 78;
  const showTime = effectiveHeight >= 38;
  const showMeta = Boolean(event.location) && effectiveHeight >= 92;
  const showCalendarChip = effectiveHeight >= 58;
  const timeLabel = `${effectiveStart} - ${effectiveEnd}`;

  const titleLines = effectiveHeight >= 120 ? 4 : effectiveHeight >= 86 ? 3 : effectiveHeight >= 56 ? 2 : 1;
  const titleSize = effectiveHeight >= 120 ? 0.78 : effectiveHeight >= 86 ? 0.74 : effectiveHeight >= 56 ? 0.7 : 0.66;

  const resetPreview = () => {
    setPreviewTop(null);
    setPreviewHeight(null);
    setPreviewStart(null);
    setPreviewEnd(null);
    setPreviewShiftX(null);
    previewStartRef.current = null;
    previewEndRef.current = null;
    previewDayShiftRef.current = 0;
  };

  const settleToFinalPosition = () => {
    setIsSettling(true);
    requestAnimationFrame(() => {
      resetPreview();
      window.setTimeout(() => setIsSettling(false), 240);
    });
  };

  const finalizeResize = () => {
    if (!onResizeEnd) return;
    const nextStart = previewStartRef.current ?? event.start;
    const nextEnd = previewEndRef.current ?? event.end;
    if (nextStart !== event.start || nextEnd !== event.end) {
      suppressClickRef.current = true;
      onResizeEnd(event, nextStart, nextEnd);
    }
  };

  const finalizeMove = () => {
    if (!onMoveEnd) return;
    const nextStart = previewStartRef.current ?? event.start;
    const nextEnd = previewEndRef.current ?? event.end;
    const dayShift = previewDayShiftRef.current;
    const nextDate = dayShift ? toDateKey(addDays(new Date(`${event.date}T00:00:00`), dayShift)) : event.date;
    if (nextDate !== event.date || nextStart !== event.start || nextEnd !== event.end) {
      suppressClickRef.current = true;
      onMoveEnd(event, nextDate, nextStart, nextEnd);
    }
  };

  const handleResizePointerDown = (mode: ResizeMode, pointerEvent: PointerEvent<HTMLSpanElement>) => {
    if (!isMutable || !onResizeEnd) return;

    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);

    const startY = pointerEvent.clientY;
    const initialStartMin = currentStartMin;
    const initialEndMin = currentEndMin;

    setIsResizing(true);

    const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
      const deltaMin = toMinutesFromPixels(moveEvent.clientY - startY);
      if (mode === "end") {
        const nextEndMin = clamp(roundTo15(initialEndMin + deltaMin), initialStartMin + 15, 1439);
        const nextDuration = nextEndMin - initialStartMin;
        setPreviewTop(top);
        setPreviewHeight(Math.max(28, (nextDuration / 1440) * DAY_GRID_HEIGHT));
        const endText = minutesToTime(nextEndMin);
        setPreviewStart(event.start);
        setPreviewEnd(endText);
        previewStartRef.current = event.start;
        previewEndRef.current = endText;
        return;
      }

      const nextStartMin = clamp(roundTo15(initialStartMin + deltaMin), 0, initialEndMin - 15);
      const nextDuration = initialEndMin - nextStartMin;
      const startOffsetPx = ((nextStartMin - initialStartMin) / 1440) * DAY_GRID_HEIGHT;
      setPreviewTop(top + startOffsetPx);
      setPreviewHeight(Math.max(28, (nextDuration / 1440) * DAY_GRID_HEIGHT));
      const startText = minutesToTime(nextStartMin);
      setPreviewStart(startText);
      setPreviewEnd(event.end);
      previewStartRef.current = startText;
      previewEndRef.current = event.end;
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      setIsResizing(false);
      finalizeResize();
      settleToFinalPosition();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  };

  const handleDragPointerDown = (pointerEvent: PointerEvent<HTMLButtonElement>) => {
    if (!isMutable || !onMoveEnd) return;
    const target = pointerEvent.target as HTMLElement;
    if (
      target.closest(".calendar-event-block__resize-handle") ||
      target.closest(".calendar-event-block__resize-handle-top")
    ) {
      return;
    }

    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);

    const startY = pointerEvent.clientY;
    const startX = pointerEvent.clientX;
    const baseStartMin = currentStartMin;
    const baseDuration = baseDurationMin;
    const dayColumnWidth = (pointerEvent.currentTarget.parentElement as HTMLElement | null)?.clientWidth ?? 0;

    setIsDragging(true);

    const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
      const deltaMinRaw = toMinutesFromPixels(moveEvent.clientY - startY);
      const snappedDeltaMin = roundTo15(deltaMinRaw);
      const boundedStartMin = clamp(baseStartMin + snappedDeltaMin, 0, 1440 - baseDuration);
      const boundedEndMin = boundedStartMin + baseDuration;
      const topOffsetPx = ((boundedStartMin - baseStartMin) / 1440) * DAY_GRID_HEIGHT;
      setPreviewTop(top + topOffsetPx);
      setPreviewHeight(Math.max(28, (baseDuration / 1440) * DAY_GRID_HEIGHT));

      const nextStartText = minutesToTime(boundedStartMin);
      const nextEndText = minutesToTime(boundedEndMin);
      setPreviewStart(nextStartText);
      setPreviewEnd(nextEndText);
      previewStartRef.current = nextStartText;
      previewEndRef.current = nextEndText;

      if (allowHorizontalDayShift && dayColumnWidth > 0) {
        const nextShift = clamp(Math.round((moveEvent.clientX - startX) / dayColumnWidth), -6, 6);
        previewDayShiftRef.current = nextShift;
        setPreviewShiftX(nextShift * dayColumnWidth);
      } else {
        previewDayShiftRef.current = 0;
        setPreviewShiftX(null);
      }
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      setIsDragging(false);
      finalizeMove();
      settleToFinalPosition();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  };

  const handleClick = (mouseEvent: MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const rect = mouseEvent.currentTarget.getBoundingClientRect();
    onClick(event, rect);
  };

  return (
    <button
      type="button"
      className={`calendar-event-block is-${currentStatus}${showStatusLabel ? " has-status" : ""}${
        showCalendarChip ? " has-calendar-chip" : ""
      }${isMutable ? " is-resizable" : ""}${isResizing ? " is-resizing" : ""}${isDragging ? " is-dragging" : ""}${
        isSettling ? " is-settling" : ""
      }`}
      data-status={currentStatus}
      aria-label={`Evento: ${event.title}, stato ${statusLabel}`}
      style={{
        top: effectiveTop,
        left: `calc(${left}% + 3px + ${previewShiftX ?? 0}px)`,
        width: `calc(${width}% - 6px)`,
        height: effectiveHeight,
        color: calendar.tc,
        ["--event-accent" as any]: calendar.color,
        ["--event-bg" as any]: calendar.bg,
        ["--event-text" as any]: calendar.tc,
        ["--event-title-size" as any]: `${titleSize}rem`,
        ["--event-title-lines" as any]: String(titleLines),
        ["--event-title-line-height" as any]: "1.18",
        ["--event-title-right-pad" as any]: showStatusLabel ? "92px" : "10px",
        ["--event-handle-height" as any]: effectiveHeight >= 72 ? "10px" : effectiveHeight >= 48 ? "8px" : "7px"
      }}
      onClick={handleClick}
      onPointerDown={handleDragPointerDown}
    >
      {showStatusLabel ? <span className="calendar-event-block__status">{statusLabel}</span> : null}
      {showCalendarChip ? <span className="calendar-event-block__calendar-chip">{calendar.name}</span> : null}
      <span className="calendar-event-block__title">{event.title}</span>
      <span className={`calendar-event-block__time${showTime ? "" : " is-collapsed"}`}>{timeLabel}</span>
      {event.location ? <span className={`calendar-event-block__meta${showMeta ? "" : " is-collapsed"}`}>{event.location}</span> : null}

      {isMutable ? (
        <>
          <span
            className="calendar-event-block__resize-handle-top"
            role="presentation"
            aria-hidden="true"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(pointerEvent) => handleResizePointerDown("start", pointerEvent)}
          />
          <span
            className="calendar-event-block__resize-handle"
            role="presentation"
            aria-hidden="true"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(pointerEvent) => handleResizePointerDown("end", pointerEvent)}
          />
        </>
      ) : null}
    </button>
  );
};
