import { RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CalendarEvent, CalendarItem } from "./calendar-types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type EventPopupProps = {
  event: CalendarEvent | null;
  draftEvent?: CalendarEvent | null;
  anchorRect: DOMRect | null;
  containerRef: RefObject<HTMLDivElement>;
  calendars: CalendarItem[];
  onClose: () => void;
  onCreate?: (draft: Partial<CalendarEvent>) => Promise<CalendarEvent | null>;
  onUpdate: (eventId: CalendarEvent["id"], patch: Partial<CalendarEvent>) => Promise<boolean>;
  onDelete: (eventId: CalendarEvent["id"]) => Promise<boolean>;
};

type DraftState = {
  title: string;
  date: string;
  start: string;
  end: string;
  location: string;
  description: string;
  calendarId: number;
  allDay: boolean;
};

type PopupTab = "details" | "notes";

const buildDraft = (event: CalendarEvent): DraftState => ({
  title: event.title,
  date: event.date,
  start: event.start,
  end: event.end,
  location: event.location ?? "",
  description: event.description ?? "",
  calendarId: event.calendarId,
  allDay: Boolean(event.allDay)
});

export const EventPopup = ({
  event,
  draftEvent = null,
  anchorRect,
  containerRef,
  calendars,
  onClose,
  onCreate,
  onUpdate,
  onDelete
}: EventPopupProps) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState({ top: 12, left: 12 });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [activeTab, setActiveTab] = useState<PopupTab>("details");

  const isCreateMode = Boolean(draftEvent && !event);
  const sourceEvent = event ?? draftEvent;

  useEffect(() => {
    if (!sourceEvent) {
      setDraft(null);
      setEditing(false);
      return;
    }
    setDraft(buildDraft(sourceEvent));
    setEditing(isCreateMode);
    setActiveTab("details");
  }, [sourceEvent, isCreateMode]);

  useLayoutEffect(() => {
    if (!sourceEvent || !containerRef.current || !panelRef.current) return;

    const container = containerRef.current;
    const panel = panelRef.current;
    const containerRect = container.getBoundingClientRect();

    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const panelWidth = Math.min(420, Math.max(320, container.clientWidth * 0.34));
    panel.style.width = `${panelWidth}px`;
    const panelHeight = panel.offsetHeight || 340;

    const defaultLeft = scrollLeft + container.clientWidth - panelWidth - 8;
    const defaultTop = scrollTop + 8;

    const anchorLeft = anchorRect
      ? anchorRect.left - containerRect.left + scrollLeft
      : defaultLeft;
    const anchorTop = anchorRect
      ? anchorRect.top - containerRect.top + scrollTop
      : defaultTop;

    const minLeft = scrollLeft + 8;
    const maxLeft = scrollLeft + container.clientWidth - panelWidth - 8;
    const minTop = scrollTop + 8;
    const maxTop = scrollTop + container.clientHeight - panelHeight - 8;

    let nextLeft = anchorLeft + 10;
    let nextTop = anchorTop + 10;

    if (nextLeft > maxLeft) nextLeft = anchorLeft - panelWidth - 12;
    if (nextTop > maxTop) nextTop = anchorTop - panelHeight - 12;

    nextLeft = Math.max(minLeft, Math.min(maxLeft, nextLeft));
    nextTop = Math.max(minTop, Math.min(maxTop, nextTop));

    setCoords({ top: nextTop, left: nextLeft });
  }, [sourceEvent, containerRef, anchorRect, editing, draft]);

  useEffect(() => {
    if (!sourceEvent) return;

    const onMouseDown = (mouseEvent: MouseEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      if (!panel.contains(mouseEvent.target as Node)) onClose();
    };

    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [sourceEvent, onClose]);

  const calendar = useMemo(() => {
    if (!draft) return null;
    return calendars.find((item) => item.id === draft.calendarId) ?? calendars[0] ?? null;
  }, [draft, calendars]);

  if (!sourceEvent || !calendar || !draft) return null;

  const readonly = !isCreateMode && Boolean(sourceEvent.readonly || sourceEvent.source === "stoppage");

  const saveChanges = async () => {
    setSaving(true);

    if (isCreateMode) {
      const created = await onCreate?.({
        title: draft.title.trim() || "Senza titolo",
        date: draft.date,
        start: draft.start,
        end: draft.end,
        location: draft.location.trim(),
        description: draft.description.trim(),
        calendarId: draft.calendarId,
        allDay: draft.allDay,
        color: calendar.color
      });
      setSaving(false);
      if (created) onClose();
      return;
    }

    if (!event) {
      setSaving(false);
      return;
    }

    const ok = await onUpdate(event.id, {
      title: draft.title.trim() || "Senza titolo",
      date: draft.date,
      start: draft.start,
      end: draft.end,
      location: draft.location.trim(),
      description: draft.description.trim(),
      calendarId: draft.calendarId,
      color: calendar.color
    });
    setSaving(false);
    if (ok) {
      setEditing(false);
      onClose();
    }
  };

  const remove = async () => {
    if (!event) return;
    setSaving(true);
    const ok = await onDelete(event.id);
    setSaving(false);
    if (ok) onClose();
  };

  const showForm = editing || isCreateMode;

  return (
    <div
      ref={panelRef}
      className="calendar-event-popup calendar-event-popup--drawer"
      style={{ top: coords.top, left: coords.left }}
      role="dialog"
      aria-label={isCreateMode ? "Nuovo evento" : `Dettaglio evento ${sourceEvent.title}`}
    >
      <div className="calendar-event-popup__head">
        <div className="calendar-event-popup__title-wrap">
          <span className="calendar-event-popup__dot" style={{ background: calendar.color }} />
          <div>
            <p className="calendar-event-popup__title">{showForm ? draft.title || "Nuovo evento" : sourceEvent.title}</p>
            <p className="calendar-event-popup__time">{`${draft.start} - ${draft.end}`}</p>
          </div>
        </div>
        <button type="button" className="calendar-event-popup__close" onClick={onClose} aria-label="Chiudi pannello evento">
          ×
        </button>
      </div>

      <div className="calendar-event-popup__tabs" role="tablist" aria-label="Sezioni evento">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "details"}
          className={`calendar-event-popup__tab ${activeTab === "details" ? "is-active" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          Dettagli
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "notes"}
          className={`calendar-event-popup__tab ${activeTab === "notes" ? "is-active" : ""}`}
          onClick={() => setActiveTab("notes")}
        >
          Note
        </button>
      </div>

      <div className="calendar-event-popup__body">
        <Badge variant="outline" style={{ borderColor: calendar.color, color: calendar.tc, background: calendar.bg }}>
          {calendar.name}
        </Badge>

        {activeTab === "details" ? (
          showForm ? (
            <div className="space-y-2">
              <Input
                value={draft.title}
                placeholder="Titolo evento"
                onChange={(ev) => setDraft((prev) => (prev ? { ...prev, title: ev.target.value } : prev))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={draft.date} onChange={(ev) => setDraft((prev) => (prev ? { ...prev, date: ev.target.value } : prev))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="time" value={draft.start} onChange={(ev) => setDraft((prev) => (prev ? { ...prev, start: ev.target.value } : prev))} />
                  <Input type="time" value={draft.end} onChange={(ev) => setDraft((prev) => (prev ? { ...prev, end: ev.target.value } : prev))} />
                </div>
              </div>
              <Input
                placeholder="Luogo"
                value={draft.location}
                onChange={(ev) => setDraft((prev) => (prev ? { ...prev, location: ev.target.value } : prev))}
              />
              <select
                className="calendar-native-select"
                value={draft.calendarId}
                onChange={(ev) => setDraft((prev) => (prev ? { ...prev, calendarId: Number(ev.target.value) } : prev))}
              >
                {calendars.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="calendar-event-popup__info-grid">
              <p className="calendar-event-popup__meta"><strong>Data:</strong> {draft.date}</p>
              <p className="calendar-event-popup__meta"><strong>Orario:</strong> {draft.start} - {draft.end}</p>
              <p className="calendar-event-popup__meta"><strong>Luogo:</strong> {sourceEvent.location || "Non specificato"}</p>
            </div>
          )
        ) : showForm ? (
          <Textarea
            rows={6}
            placeholder="Descrizione / note operative"
            value={draft.description}
            onChange={(ev) => setDraft((prev) => (prev ? { ...prev, description: ev.target.value } : prev))}
          />
        ) : (
          <p className="calendar-event-popup__meta">{sourceEvent.description || "Nessuna nota disponibile."}</p>
        )}
      </div>

      <div className="calendar-event-popup__actions">
        {readonly ? (
          <p className="text-xs text-[var(--cal-ink4)]">Evento di sola lettura</p>
        ) : isCreateMode ? (
          <>
            <Button size="sm" variant="outline" onClick={onClose} disabled={saving}>
              Annulla
            </Button>
            <Button size="sm" onClick={() => void saveChanges()} disabled={saving}>
              Crea evento
            </Button>
          </>
        ) : (
          <>
            {editing ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  Annulla
                </Button>
                <Button size="sm" onClick={() => void saveChanges()} disabled={saving}>
                  Salva
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={saving}>
                  Modifica
                </Button>
                <Button size="sm" variant="destructive" onClick={() => void remove()} disabled={saving}>
                  Elimina
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
